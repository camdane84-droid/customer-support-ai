import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { business_id } = await request.json();

    if (!business_id) {
      return NextResponse.json({ error: 'business_id required' }, { status: 400 });
    }

    // Get WhatsApp connection
    const { data: connection, error: connError } = await supabaseAdmin
      .from('social_connections')
      .select('*')
      .eq('business_id', business_id)
      .eq('platform', 'whatsapp')
      .eq('is_active', true)
      .single();

    if (connError || !connection) {
      return NextResponse.json({ error: 'WhatsApp connection not found' }, { status: 404 });
    }

    const wabaId = connection.metadata?.waba_id;
    const accessToken = connection.access_token;

    if (!wabaId || !accessToken) {
      return NextResponse.json({ error: 'Missing WABA ID or access token' }, { status: 400 });
    }

    // Subscribe webhook to WABA
    logger.info('Manually subscribing webhook to WABA', { wabaId, business_id });

    const subscribeResponse = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/subscribed_apps?` +
      `subscribed_fields=messages&` +
      `access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const subscribeData = await subscribeResponse.json();

    if (!subscribeResponse.ok) {
      logger.error('Failed to subscribe webhook', undefined, { wabaId, error: subscribeData });
      return NextResponse.json({
        error: 'Webhook subscription failed',
        details: subscribeData
      }, { status: 500 });
    }

    logger.success('Webhook successfully subscribed', { wabaId, subscribeData });

    return NextResponse.json({
      success: true,
      message: 'Webhook subscribed to WABA',
      data: subscribeData
    });

  } catch (error: any) {
    logger.error('Subscribe webhook error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
