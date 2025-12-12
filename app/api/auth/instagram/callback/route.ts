import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Contains business_id
  const error = searchParams.get('error');

  if (error) {
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=instagram_auth_failed`;
    return NextResponse.redirect(redirectUrl);
  }

  if (!code || !state) {
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=missing_code`;
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // Exchange code for Facebook access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${process.env.META_APP_ID}&` +
      `client_secret=${process.env.META_APP_SECRET}&` +
      `redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`)}&` +
      `code=${code}`
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      throw new Error(tokenData.error?.message || 'Failed to get access token');
    }

    // Get user's Facebook pages (which have connected Instagram accounts)
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${tokenData.access_token}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('No Facebook pages found. You need to connect an Instagram Business account to a Facebook Page first.');
    }

    // Get Instagram account connected to the first page
    const pageAccessToken = pagesData.data[0].access_token;
    const pageId = pagesData.data[0].id;

    const igAccountResponse = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );
    const igAccountData = await igAccountResponse.json();

    if (!igAccountData.instagram_business_account) {
      throw new Error('No Instagram Business account connected to this Facebook Page.');
    }

    const igUserId = igAccountData.instagram_business_account.id;

    // Get Instagram username
    const igUserResponse = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}?fields=username&access_token=${pageAccessToken}`
    );
    const userData = await igUserResponse.json();

    // Save connection to database (use page access token for Instagram Business API)
    // Use supabaseAdmin to bypass RLS policies
    const { error: dbError } = await supabaseAdmin
      .from('social_connections')
      .upsert({
        business_id: state, // state contains business_id
        platform: 'instagram',
        platform_user_id: igUserId,
        platform_username: userData.username,
        access_token: pageAccessToken, // Use page access token, not user token
        token_expires_at: null, // Page tokens don't expire
        is_active: true,
        metadata: {
          page_id: pageId,
          page_name: pagesData.data[0].name,
        },
      }, {
        onConflict: 'business_id,platform,platform_user_id', // Specify conflict columns
        ignoreDuplicates: false // Update on conflict
      });

    if (dbError) throw dbError;

    // Use NEXT_PUBLIC_APP_URL for redirect to ensure we use ngrok URL
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=instagram_connected`;
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Instagram OAuth error:', error);
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${encodeURIComponent(error.message)}`;
    return NextResponse.redirect(redirectUrl);
  }
}
