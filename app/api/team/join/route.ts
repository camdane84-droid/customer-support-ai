import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { authenticateUser } from '@/lib/api/auth-middleware';

// POST /api/team/join
export async function POST(request: NextRequest) {
  const auth = await authenticateUser(request);
  if (!auth.success) return auth.response;

  const { userId } = auth;

  try {
    const body = await request.json();
    const { token, businessName } = body;

    // Option 1: Join via invitation token
    if (token) {
      const { data: invitation, error: inviteError } = await supabaseAdmin
        .from('team_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitation) {
        return NextResponse.json(
          { error: 'Invalid or expired invitation' },
          { status: 400 }
        );
      }

      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        await supabaseAdmin
          .from('team_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);

        return NextResponse.json(
          { error: 'This invitation has expired' },
          { status: 400 }
        );
      }

      // Check if user is already a member
      const { data: existingMember } = await supabaseAdmin
        .from('business_members')
        .select('id, role')
        .eq('business_id', invitation.business_id)
        .eq('user_id', userId)
        .single();

      let member;

      if (existingMember) {
        // User already exists - update their role if invitation has different role
        if (existingMember.role !== invitation.role) {
          const { data: updatedMember, error: updateError } = await supabaseAdmin
            .from('business_members')
            .update({ role: invitation.role })
            .eq('id', existingMember.id)
            .select()
            .single();

          if (updateError) throw updateError;
          member = updatedMember;
        } else {
          // Same role, just use existing membership
          member = existingMember;
        }
      } else {
        // New member - add to business
        console.log('➕ [JOIN] Adding new member:', { userId, businessId: invitation.business_id, role: invitation.role });
        const { data: newMember, error: memberError } = await supabaseAdmin
          .from('business_members')
          .insert({
            business_id: invitation.business_id,
            user_id: userId,
            role: invitation.role,
            invited_by: invitation.invited_by,
          })
          .select()
          .single();

        if (memberError) {
          console.error('❌ [JOIN] Failed to add member:', memberError);
          throw memberError;
        }
        console.log('✅ [JOIN] Member added successfully:', newMember);
        member = newMember;
      }

      // Update invitation status
      console.log('📝 [JOIN] Updating invitation status to accepted');
      const { error: updateError } = await supabaseAdmin
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('❌ [JOIN] Failed to update invitation status:', updateError);
        // Don't throw - member was already added
      }

      return NextResponse.json({
        success: true,
        businessId: invitation.business_id,
        member,
      });
    }

    // Option 2: Join via business name
    if (businessName) {
      // Find businesses with matching name_slug
      const { data: businesses, error: searchError } = await supabaseAdmin
        .rpc('slugify', { text: businessName })
        .then(async (slugResult) => {
          return await supabaseAdmin
            .from('businesses')
            .select('id, name, email')
            .eq('name_slug', slugResult.data);
        });

      if (searchError) throw searchError;

      if (!businesses || businesses.length === 0) {
        return NextResponse.json(
          { error: 'No business found with that name' },
          { status: 404 }
        );
      }

      // If multiple matches, return list for user to choose
      if (businesses.length > 1) {
        return NextResponse.json({
          multiple: true,
          businesses,
        });
      }

      const business = businesses[0];

      // Check if user is already a member
      const { data: existingMember } = await supabaseAdmin
        .from('business_members')
        .select('id')
        .eq('business_id', business.id)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: 'You are already a member of this business' },
          { status: 400 }
        );
      }

      // Add user as agent by default
      const { data: member, error: memberError } = await supabaseAdmin
        .from('business_members')
        .insert({
          business_id: business.id,
          user_id: userId,
          role: 'agent',
        })
        .select()
        .single();

      if (memberError) throw memberError;

      return NextResponse.json({
        success: true,
        businessId: business.id,
        member,
      });
    }

    // Option 3: Join by selecting from multiple matches (businessId provided)
    const { businessId } = body;
    if (businessId) {
      // Verify business exists
      const { data: business, error: businessError } = await supabaseAdmin
        .from('businesses')
        .select('id')
        .eq('id', businessId)
        .single();

      if (businessError || !business) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }

      // Check if user is already a member
      const { data: existingMember } = await supabaseAdmin
        .from('business_members')
        .select('id')
        .eq('business_id', businessId)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: 'You are already a member of this business' },
          { status: 400 }
        );
      }

      // Add user as agent by default
      const { data: member, error: memberError } = await supabaseAdmin
        .from('business_members')
        .insert({
          business_id: businessId,
          user_id: userId,
          role: 'agent',
        })
        .select()
        .single();

      if (memberError) throw memberError;

      return NextResponse.json({
        success: true,
        businessId: businessId,
        member,
      });
    }

    return NextResponse.json(
      { error: 'Either token, businessName, or businessId is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error joining business:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to join business' },
      { status: 500 }
    );
  }
}
