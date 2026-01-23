import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Contains business_id
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    logger.error('TikTok OAuth error', undefined, { error, errorDescription });
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=tiktok_auth_failed&message=${encodeURIComponent(errorDescription || error)}`;
    return NextResponse.redirect(redirectUrl);
  }

  if (!code || !state) {
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=missing_code`;
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY || '',
        client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to get access token');
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in; // seconds
    const openId = tokenData.open_id;
    const scope = tokenData.scope;

    logger.info('TikTok token received', { openId, scope, expiresIn });

    // Get user info using the access token
    const userInfoResponse = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const userInfoData = await userInfoResponse.json();

    if (!userInfoResponse.ok || userInfoData.error?.code) {
      throw new Error(userInfoData.error?.message || 'Failed to get user info');
    }

    const userData = userInfoData.data?.user;
    const tiktokUsername = userData?.username || userData?.display_name || openId;

    logger.info('TikTok user info retrieved', { username: tiktokUsername, openId });

    // Calculate token expiration time
    const tokenExpiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString();

    // Save connection to database
    const { error: dbError } = await supabaseAdmin
      .from('social_connections')
      .upsert({
        business_id: state,
        platform: 'tiktok',
        platform_user_id: openId,
        platform_username: tiktokUsername,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: tokenExpiresAt,
        is_active: true,
        metadata: {
          union_id: userData?.union_id,
          avatar_url: userData?.avatar_url,
          display_name: userData?.display_name,
          scope: scope,
        },
      }, {
        onConflict: 'business_id,platform,platform_user_id',
        ignoreDuplicates: false
      });

    if (dbError) throw dbError;

    logger.success('TikTok connection saved', { businessId: state, username: tiktokUsername });

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=tiktok_connected`;
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    logger.error('TikTok OAuth error', error);
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${encodeURIComponent(error.message)}`;
    return NextResponse.redirect(redirectUrl);
  }
}
