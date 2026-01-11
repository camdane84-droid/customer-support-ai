import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Contains business_id
  const error = searchParams.get('error');

  if (error) {
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=whatsapp_auth_failed`;
    return NextResponse.redirect(redirectUrl);
  }

  if (!code || !state) {
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=missing_code`;
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${process.env.META_APP_ID}&` +
      `client_secret=${process.env.META_APP_SECRET}&` +
      `redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/whatsapp/callback`)}&` +
      `code=${code}`
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      throw new Error(tokenData.error?.message || 'Failed to get access token');
    }

    // Get user's WhatsApp Business Accounts
    const wabResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/businesses?access_token=${tokenData.access_token}`
    );
    const businessData = await wabResponse.json();

    if (!businessData.data || businessData.data.length === 0) {
      throw new Error('No businesses found. You need to set up a WhatsApp Business account first.');
    }

    // Get the first business ID
    const businessId = businessData.data[0].id;

    // Get WhatsApp Business Accounts for this business
    const wabaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${businessId}/owned_whatsapp_business_accounts?access_token=${tokenData.access_token}`
    );
    const wabaData = await wabaResponse.json();

    if (!wabaData.data || wabaData.data.length === 0) {
      throw new Error('No WhatsApp Business accounts found for this business.');
    }

    const wabaId = wabaData.data[0].id;

    // Get phone numbers associated with this WABA
    const phoneResponse = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?access_token=${tokenData.access_token}`
    );
    const phoneData = await phoneResponse.json();

    if (!phoneData.data || phoneData.data.length === 0) {
      throw new Error('No phone numbers found for this WhatsApp Business account.');
    }

    const phoneNumber = phoneData.data[0];
    const phoneNumberId = phoneNumber.id;
    const displayPhoneNumber = phoneNumber.display_phone_number;

    // Save connection to database
    const { error: dbError } = await supabaseAdmin
      .from('social_connections')
      .upsert({
        business_id: state, // state contains business_id
        platform: 'whatsapp',
        platform_user_id: wabaId,
        platform_username: displayPhoneNumber,
        access_token: tokenData.access_token,
        token_expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
        is_active: true,
        metadata: {
          phone_number_id: phoneNumberId,
          display_phone_number: displayPhoneNumber,
          waba_id: wabaId,
          business_id: businessId,
        },
      }, {
        onConflict: 'business_id,platform,platform_user_id',
        ignoreDuplicates: false
      });

    if (dbError) throw dbError;

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=whatsapp_connected`;
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    logger.error('WhatsApp OAuth error', error);
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${encodeURIComponent(error.message)}`;
    return NextResponse.redirect(redirectUrl);
  }
}
