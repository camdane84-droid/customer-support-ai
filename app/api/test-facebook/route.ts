import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test if we can reach Facebook Graph API
    const response = await fetch('https://graph.facebook.com/v21.0/me?access_token=test');
    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Can reach Facebook API',
      facebookReachable: true,
      // Facebook should return an error about invalid token, but at least we can reach it
      facebookResponse: data,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      message: 'Cannot reach Facebook API - network issue',
    }, { status: 500 });
  }
}
