import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { authenticateUser } from '@/lib/api/auth-middleware';
import { logger } from '@/lib/logger';

// GET /api/businesses - Get all businesses user belongs to
export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request);
  if (!auth.success) return auth.response;

  const { userId } = auth;

  try {
    const { data, error } = await supabaseAdmin
      .from('business_members')
      .select(`
        role,
        joined_at,
        businesses (
          id,
          name,
          email,
          business_type,
          policies,
          subscription_status,
          subscription_plan,
          subscription_tier,
          stripe_customer_id,
          created_at,
          auto_generate_notes
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: true });

    if (error) throw error;

    const businesses = data.map(item => ({
      ...(item as any).businesses,
      member_role: item.role,
      member_joined_at: item.joined_at,
    }));

    return NextResponse.json({ businesses });
  } catch (error: any) {
    logger.error('Error fetching businesses', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}

// POST /api/businesses - Create a new business and add user as owner
export async function POST(request: NextRequest) {
  logger.info('[POST /api/businesses] Business creation request received');

  const auth = await authenticateUser(request);
  logger.debug('[POST /api/businesses] Auth result', { success: auth.success, userId: auth.success ? auth.userId : 'N/A' });

  if (!auth.success) {
    logger.error('[POST /api/businesses] Authentication failed');
    return auth.response;
  }

  const { userId } = auth;

  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Business name and email are required' },
        { status: 400 }
      );
    }

    // Create the business using admin client (bypasses RLS)
    const { data: businessData, error: businessError } = await supabaseAdmin
      .from('businesses')
      .insert({
        name,
        email,
      })
      .select()
      .single();

    if (businessError) {
      logger.error('Business creation error', businessError);

      // User-friendly error messages
      if (businessError.code === '23505') {
        return NextResponse.json(
          { error: 'A business with this name already exists. Please choose a different name or ask the business owner for an invitation link.' },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { error: 'Unable to create your business. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Add user as owner using admin client (bypasses RLS)
    logger.debug('Adding user as owner', { userId, businessId: businessData.id });
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('business_members')
      .insert({
        business_id: businessData.id,
        user_id: userId,
        role: 'owner',
      })
      .select()
      .single();

    if (memberError) {
      logger.error('Failed to add user as owner', memberError);

      // Rollback: delete the business we just created
      await supabaseAdmin
        .from('businesses')
        .delete()
        .eq('id', businessData.id);

      return NextResponse.json(
        { error: 'Failed to set up business ownership. Please try again.' },
        { status: 500 }
      );
    }

    logger.success('Business created successfully and user added as owner', { memberId: memberData.id });

    // Verify membership was created
    const { data: verifyMember } = await supabaseAdmin
      .from('business_members')
      .select('*')
      .eq('business_id', businessData.id)
      .eq('user_id', userId)
      .single();

    logger.debug('Membership verification', { verified: !!verifyMember });

    return NextResponse.json({ business: businessData });
  } catch (error: any) {
    logger.error('Error creating business', error);
    return NextResponse.json(
      { error: 'Failed to create business' },
      { status: 500 }
    );
  }
}
