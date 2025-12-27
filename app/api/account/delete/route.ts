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

    // Get user's business
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Verify business name matches
    if (business.name !== businessName) {
      return NextResponse.json(
        { error: 'Business name does not match' },
        { status: 400 }
      );
    }

    // Delete all related data
    await supabaseAdmin.from('messages').delete().eq('business_id', business.id);
    await supabaseAdmin.from('conversations').delete().eq('business_id', business.id);
    await supabaseAdmin.from('social_connections').delete().eq('business_id', business.id);
    await supabaseAdmin.from('canned_responses').delete().eq('business_id', business.id);
    await supabaseAdmin.from('customers').delete().eq('business_id', business.id);

    // Delete business
    await supabaseAdmin.from('businesses').delete().eq('id', business.id);

    // Delete user account using admin client
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}
