import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { logger } from '@/lib/logger';
import { exchangeForLongLivedToken } from '@/lib/api/meta-tokens';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Contains business_id

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=missing_code`, request.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${process.env.META_APP_ID}&` +
      `client_secret=${process.env.META_APP_SECRET}&` +
      `redirect_uri=${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback&` +
      `code=${code}`
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message);
    }

    // Exchange short-lived token for long-lived user token (~60 days)
    const longLived = await exchangeForLongLivedToken(tokenData.access_token, 'facebook');
    const longLivedUserToken = longLived.access_token;
    const userTokenExpiresAt = new Date(Date.now() + longLived.expires_in * 1000).toISOString();

    // Get user's Facebook pages using long-lived user token
    // Page tokens derived from a long-lived user token are permanent
    const pagesResponse = await fetch(
      `https://graph.facebook.com/me/accounts?access_token=${longLivedUserToken}`
    );
    const pagesData = await pagesResponse.json();

    // For now, connect the first page (in production, let user choose)
    const firstPage = pagesData.data?.[0];

    if (!firstPage) {
      throw new Error('No Facebook pages found');
    }

    // Save connection using supabaseAdmin (server-side route, bypass RLS)
    const { error: dbError } = await supabaseAdmin
      .from('social_connections')
      .upsert({
        business_id: state,
        platform: 'facebook',
        platform_user_id: firstPage.id,
        platform_username: firstPage.name,
        access_token: firstPage.access_token, // Permanent page token
        token_expires_at: userTokenExpiresAt, // Track user token expiry for refresh
        is_active: true,
        last_synced_at: new Date().toISOString(),
        metadata: {
          long_lived_user_token: longLivedUserToken, // For future token refresh
        },
      }, {
        onConflict: 'business_id,platform,platform_user_id',
        ignoreDuplicates: false
      });

    if (dbError) throw dbError;

    return NextResponse.redirect(
      new URL('/dashboard/settings?success=facebook_connected', request.url)
    );
  } catch (error: any) {
    logger.error('Facebook OAuth error', error);
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=${error.message}`, request.url)
    );
  }
}
