import { NextResponse } from 'next/server';

export async function GET() {
  const pageId = '892737327256698'; // Your Facebook Page ID
  const pageAccessToken = 'EAAeLGCPse3gBQKcKrQHXyZB9jCCTkkdF6SJATy2Jryn76kfcK1ZBCOCVcNajZCMtoradoZB4ba3bGpnoXRvhLKIqGhZBkTknroZC3W0Am8DppXlWJDcoKbG9KRIl1SEkvoJSZAaO7FvCVcSPfAqZAusfvg3jbshO7dZA8z7IMcsUD2QoB2QulQE1PqYzvxDiV4AltfbTvWCm1'; // From your test earlier

  try {
    // Subscribe page to webhook
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?` +
      `subscribed_fields=messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads&` +
      `access_token=${pageAccessToken}`,
      { method: 'POST' }
    );

    const data = await response.json();

    if (data.success) {
      return NextResponse.json({
        success: true,
        message: 'Webhook subscribed successfully!',
        data
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data.error || data,
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
