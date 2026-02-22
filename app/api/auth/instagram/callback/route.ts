import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { logger } from '@/lib/logger';
import { exchangeForLongLivedToken } from '@/lib/api/meta-tokens';

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

    // Exchange short-lived user token for long-lived user token (~60 days)
    let longLivedUserToken: string;
    let userTokenExpiresAt: string;
    try {
      const longLived = await exchangeForLongLivedToken(tokenData.access_token, 'instagram');
      longLivedUserToken = longLived.access_token;
      userTokenExpiresAt = new Date(Date.now() + longLived.expires_in * 1000).toISOString();
      logger.info('Instagram long-lived token exchange succeeded', { expiresIn: longLived.expires_in });
    } catch (exchangeError: any) {
      // If exchange fails, fall back to short-lived token so connection still works
      logger.warn('Long-lived token exchange failed, falling back to short-lived token', {
        error: exchangeError.message,
      });
      longLivedUserToken = tokenData.access_token;
      userTokenExpiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : new Date(Date.now() + 3600 * 1000).toISOString(); // Default 1 hour
    }

    // Get user's Facebook pages using long-lived user token
    // Page tokens derived from a long-lived user token are permanent (never expire)
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedUserToken}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('No Facebook pages found. You need to connect an Instagram Business account to a Facebook Page first.');
    }

    // Get Instagram account connected to the first page
    // This page token is permanent (derived from long-lived user token)
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

    // Save connection to database
    // access_token = permanent page token (for API calls)
    // metadata.long_lived_user_token = long-lived user token (for future refresh)
    // token_expires_at = user token expiry (for refresh scheduling)
    const { error: dbError } = await supabaseAdmin
      .from('social_connections')
      .upsert({
        business_id: state,
        platform: 'instagram',
        platform_user_id: igUserId,
        platform_username: userData.username,
        access_token: pageAccessToken, // Permanent page token
        token_expires_at: userTokenExpiresAt, // Track user token expiry for refresh
        is_active: true,
        metadata: {
          page_id: pageId,
          page_name: pagesData.data[0].name,
          long_lived_user_token: longLivedUserToken, // For future token refresh
        },
      }, {
        onConflict: 'business_id,platform,platform_user_id',
        ignoreDuplicates: false
      });

    if (dbError) throw dbError;

    // Use NEXT_PUBLIC_APP_URL for redirect to ensure we use ngrok URL
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=instagram_connected`;
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    logger.error('Instagram OAuth error', error);
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${encodeURIComponent(error.message)}`;
    return NextResponse.redirect(redirectUrl);
  }
}
