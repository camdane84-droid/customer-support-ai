import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { authenticateRequest } from '@/lib/api/auth-middleware';
import type { Role } from '@/lib/permissions';

// PATCH /api/team/members/[id] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateRequest(request, undefined, ['owner', 'admin']);
  if (!auth.success) return auth.response;

  const { userId, businessId, role: userRole } = auth.data;
  const memberId = params.id;

  try {
    const { role: newRole } = await request.json();

    if (!newRole || !['owner', 'admin', 'agent', 'viewer'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Get the member being updated
    const { data: targetMember, error: fetchError } = await supabaseAdmin
      .from('business_members')
      .select('*')
      .eq('id', memberId)
      .eq('business_id', businessId)
      .single();

    if (fetchError || !targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent demoting the last owner
    if (targetMember.role === 'owner' && newRole !== 'owner') {
      const { data: ownerCount } = await supabaseAdmin
        .from('business_members')
        .select('id', { count: 'exact' })
        .eq('business_id', businessId)
        .eq('role', 'owner');

      if (ownerCount && ownerCount.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the last owner' },
          { status: 400 }
        );
      }
    }

    // Admins cannot promote to owner or modify other admins/owners
    if (userRole === 'admin') {
      if (newRole === 'owner') {
        return NextResponse.json(
          { error: 'Only owners can assign owner role' },
          { status: 403 }
        );
      }
      if (['owner', 'admin'].includes(targetMember.role)) {
        return NextResponse.json(
          { error: 'Admins cannot modify owners or other admins' },
          { status: 403 }
        );
      }
    }

    // Update the role
    const { data: updatedMember, error: updateError } = await supabaseAdmin
      .from('business_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ member: updatedMember });
  } catch (error: any) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update member role' },
      { status: 500 }
    );
  }
}
