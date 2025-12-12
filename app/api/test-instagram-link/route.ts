import { NextResponse } from 'next/server';

export async function GET() {
  const pageId = '892737327256698';
  const pageAccessToken = 'EAAeLGCPse3gBQKcKrQHXyZB9jCCTkkdF6SJATy2Jryn76kfcK1ZBCOCVcNajZCMtoradoZB4ba3bGpnoXRvhLKIqGhZBkTknroZC3W0Am8DppXlWJDcoKbG9KRIl1SEkvoJSZAaO7FvCVcSPfAqZAusfvg3jbshO7dZA8z7IMcsUD2QoB2QulQE1PqYzvxDiV4AltfbTvWCm1';

  try {
    // Check if page has Instagram Business account
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );

    const data = await response.json();

    if (data.instagram_business_account) {
      // Get Instagram account details
      const igResponse = await fetch(
        `https://graph.facebook.com/v21.0/${data.instagram_business_account.id}?fields=id,username,name,profile_picture_url&access_token=${pageAccessToken}`
      );
      const igData = await igResponse.json();

      return NextResponse.json({
        success: true,
        hasInstagram: true,
        page: {
          id: pageId,
          name: 'Inboxforgetestpage'
        },
        instagram: igData,
      });
    } else {
      return NextResponse.json({
        success: true,
        hasInstagram: false,
        page: {
          id: pageId,
          name: 'Inboxforgetestpage'
        },
        message: 'This Facebook Page does not have an Instagram Business account connected.',
        instructions: 'Go to your Facebook Page settings and connect your Instagram Business account.'
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
