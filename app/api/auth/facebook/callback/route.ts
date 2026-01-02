import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/api/supabase';
import { logger } from '@/lib/logger';

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

    // Get user's Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/me/accounts?access_token=${tokenData.access_token}`
    );
    const pagesData = await pagesResponse.json();

    // For now, connect the first page (in production, let user choose)
    const firstPage = pagesData.data?.[0];

    if (!firstPage) {
      throw new Error('No Facebook pages found');
    }

    // Save connection
    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        business_id: state,
        platform: 'facebook',
        platform_user_id: firstPage.id,
        platform_username: firstPage.name,
        access_token: firstPage.access_token, // Use page token, not user token
        is_active: true,
        last_synced_at: new Date().toISOString(),
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
