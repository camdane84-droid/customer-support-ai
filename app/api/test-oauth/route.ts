import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    // Generate OAuth URL for testing - using business_management scope
    const authUrl =
      `https://www.facebook.com/v21.0/dialog/oauth?` +
      `client_id=${process.env.META_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/test-oauth`)}&` +
      `scope=business_management,pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_messages,pages_manage_metadata&` +
      `response_type=code`;

    return NextResponse.redirect(authUrl);
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${process.env.META_APP_ID}&` +
      `client_secret=${process.env.META_APP_SECRET}&` +
      `redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/test-oauth`)}&` +
      `code=${code}`
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.json({
        step: 'token_exchange',
        error: tokenData.error,
      });
    }

    // Get pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${tokenData.access_token}`
    );
    const pagesData = await pagesResponse.json();

    // Get user info
    const userResponse = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${tokenData.access_token}`
    );
    const userData = await userResponse.json();

    return NextResponse.json({
      success: true,
      user: userData,
      pagesCount: pagesData.data?.length || 0,
      pages: pagesData.data || [],
      pagesError: pagesData.error || null,
      rawPagesResponse: pagesData,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
