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
    logger.info('[IG-CALLBACK] Step 1: Exchanging code for token', { state });

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

    logger.info('[IG-CALLBACK] Step 2: Got short-lived token, exchanging for long-lived');

    // Exchange short-lived user token for long-lived user token (~60 days)
    let longLivedUserToken: string;
    let userTokenExpiresAt: string;
    try {
      const longLived = await exchangeForLongLivedToken(tokenData.access_token, 'instagram');
      longLivedUserToken = longLived.access_token;
      userTokenExpiresAt = new Date(Date.now() + longLived.expires_in * 1000).toISOString();
      logger.info('[IG-CALLBACK] Step 2 SUCCESS: Long-lived token obtained', {
        expiresIn: longLived.expires_in,
        userTokenExpiresAt,
        tokenLength: longLivedUserToken.length,
      });
    } catch (exchangeError: any) {
      logger.warn('[IG-CALLBACK] Step 2 FAILED: Long-lived exchange failed, using short-lived', {
        error: exchangeError.message,
      });
      longLivedUserToken = tokenData.access_token;
      userTokenExpiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : new Date(Date.now() + 3600 * 1000).toISOString();
    }

    logger.info('[IG-CALLBACK] Step 3: Fetching pages');

    // Get user's Facebook pages using long-lived user token
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedUserToken}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('No Facebook pages found. You need to connect an Instagram Business account to a Facebook Page first.');
    }

    const pageAccessToken = pagesData.data[0].access_token;
    const pageId = pagesData.data[0].id;

    logger.info('[IG-CALLBACK] Step 4: Fetching IG account for page', { pageId });

    const igAccountResponse = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );
    const igAccountData = await igAccountResponse.json();

    if (!igAccountData.instagram_business_account) {
      throw new Error('No Instagram Business account connected to this Facebook Page.');
    }

    const igUserId = igAccountData.instagram_business_account.id;

    const igUserResponse = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}?fields=username&access_token=${pageAccessToken}`
    );
    const userData = await igUserResponse.json();

    logger.info('[IG-CALLBACK] Step 5: Upserting to DB', {
      igUserId,
      username: userData.username,
      hasTokenExpiresAt: !!userTokenExpiresAt,
      tokenExpiresAt: userTokenExpiresAt,
      hasLongLivedToken: !!longLivedUserToken,
      pageId,
    });

    // Save connection to database
    const { data: upsertData, error: dbError } = await supabaseAdmin
      .from('social_connections')
      .upsert({
        business_id: state,
        platform: 'instagram',
        platform_user_id: igUserId,
        platform_username: userData.username,
        access_token: pageAccessToken,
        token_expires_at: userTokenExpiresAt,
        is_active: true,
        metadata: {
          page_id: pageId,
          page_name: pagesData.data[0].name,
          long_lived_user_token: longLivedUserToken,
        },
      }, {
        onConflict: 'business_id,platform,platform_user_id',
        ignoreDuplicates: false
      })
      .select();

    logger.info('[IG-CALLBACK] Step 6: Upsert result', {
      dbError: dbError?.message || null,
      upsertData,
    });

    if (dbError) throw dbError;

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=instagram_connected`;
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    logger.error('[IG-CALLBACK] FAILED', error, { message: error.message });
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${encodeURIComponent(error.message)}`;
    return NextResponse.redirect(redirectUrl);
  }
}
