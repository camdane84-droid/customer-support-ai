import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { authenticateRequest } from '@/lib/api/auth-middleware';

// GET /api/team/members?businessId=xxx
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.success) return auth.response;

  const { businessId } = auth.data;

  try {
    const { data, error } = await supabaseAdmin
      .from('business_members')
      .select('id, role, joined_at, user_id, created_at')
      .eq('business_id', businessId)
      .order('joined_at', { ascending: true });

    if (error) throw error;

    // Fetch user emails
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();

    const members = data.map(member => {
      const user = users.users.find(u => u.id === member.user_id);
      return {
        ...member,
        email: user?.email || '',
      };
    });

    return NextResponse.json({ members });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

// DELETE /api/team/members?businessId=xxx&memberId=xxx
export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest(request, undefined, ['owner', 'admin']);
  if (!auth.success) return auth.response;

  const { businessId } = auth.data;
  const memberId = request.nextUrl.searchParams.get('memberId');

  if (!memberId) {
    return NextResponse.json({ error: 'memberId required' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin
      .from('business_members')
      .delete()
      .eq('id', memberId)
      .eq('business_id', businessId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
