import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/api/auth-middleware';
import { supabaseAdmin } from '@/lib/api/supabase-admin';

export async function POST(request: NextRequest) {
  // Authenticate user
  const auth = await authenticateUser(request);
  if (!auth.success) {
    return auth.response;
  }

  const { userId } = auth;

  try {
    const { businessName } = await request.json();

    // Get user's email
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const userEmail = userData?.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      );
    }

    // Try to find business by user_id first, then fall back to email (for legacy accounts)
    let { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If not found by user_id, try by email (legacy accounts without user_id)
    if (bizError || !business) {
      const result = await supabaseAdmin
        .from('businesses')
        .select('*')
        .eq('email', userEmail)
        .single();

      business = result.data;
      bizError = result.error;
    }

    // If business exists, verify name matches and delete business data
    if (business) {
      // Verify business name matches
      if (business.name !== businessName) {
        return NextResponse.json(
          { error: 'Business name does not match' },
          { status: 400 }
        );
      }

      console.log('🗑️ Deleting business and related data for:', business.name);

      // Delete all related data
      await supabaseAdmin.from('messages').delete().eq('business_id', business.id);
      await supabaseAdmin.from('conversations').delete().eq('business_id', business.id);
      await supabaseAdmin.from('social_connections').delete().eq('business_id', business.id);
      await supabaseAdmin.from('canned_responses').delete().eq('business_id', business.id);
      await supabaseAdmin.from('customers').delete().eq('business_id', business.id);
      await supabaseAdmin.from('business_members').delete().eq('business_id', business.id);

      // Delete business
      await supabaseAdmin.from('businesses').delete().eq('id', business.id);
    } else {
      // Business doesn't exist (might have been merged/deleted)
      // Just clean up user's memberships
      console.log('⚠️ Business not found, cleaning up user memberships for:', userId);
      await supabaseAdmin.from('business_members').delete().eq('user_id', userId);
    }

    // Delete user account using admin client
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw deleteError;
    }

    console.log('✅ Account deleted successfully for user:', userEmail);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error deleting account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}
