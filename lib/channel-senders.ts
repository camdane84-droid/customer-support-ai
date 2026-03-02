/**
 * Channel-specific message send handlers.
 * Extracted from messages/route.ts so both the manual send flow
 * and the auto-reply endpoint can reuse them.
 */

import { sendEmail } from '@/lib/api/email';
import { ensureValidMetaToken } from '@/lib/api/meta-tokens';
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Message } from '@/lib/api/supabase';

// ── Email ──────────────────────────────────────────────────────

export async function handleEmailSend(
  message: Message,
  businessId: string,
  supabase: SupabaseClient
) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Email service not configured. Please add RESEND_API_KEY to your environment variables.');
  }

  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('customer_email, customer_name')
    .eq('id', message.conversation_id)
    .single();

  if (convError) {
    throw new Error(`Failed to fetch conversation: ${convError.message}`);
  }

  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('email, name')
    .eq('id', businessId)
    .single();

  if (bizError) {
    throw new Error(`Failed to fetch business: ${bizError.message}`);
  }

  if (!conversation?.customer_email) {
    throw new Error('Customer email not found in conversation');
  }

  if (!business?.email) {
    throw new Error('Business email not found');
  }

  try {
    await sendEmail({
      to: conversation.customer_email,
      from: `${business.name} <${business.email}>`,
      subject: `Re: Message from ${business.name}`,
      text: message.content,
    });
  } catch (emailError: any) {
    throw new Error(`Email delivery failed: ${emailError.message}`);
  }
}

// ── Instagram ──────────────────────────────────────────────────

export async function handleInstagramSend(
  message: Message,
  businessId: string,
  supabase: SupabaseClient
) {
  const { data: connection, error: connError } = await supabase
    .from('social_connections')
    .select('*')
    .eq('business_id', businessId)
    .eq('platform', 'instagram')
    .eq('is_active', true)
    .single();

  if (connError || !connection) {
    throw new Error('Instagram not connected');
  }

  const accessToken = await ensureValidMetaToken(connection, 'instagram');

  const { data: conversation } = await supabase
    .from('conversations')
    .select('customer_instagram_id')
    .eq('id', message.conversation_id)
    .single();

  if (!conversation?.customer_instagram_id) {
    throw new Error('Customer Instagram ID not found');
  }

  const url = `https://graph.facebook.com/v21.0/${connection.platform_user_id}/messages?access_token=${accessToken}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: conversation.customer_instagram_id },
      message: { text: message.content },
    }),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.error?.message || 'Failed to send Instagram message');
  }
}

// ── WhatsApp ───────────────────────────────────────────────────

export async function handleWhatsAppSend(
  message: Message,
  businessId: string,
  supabase: SupabaseClient
) {
  const { data: connection, error: connError } = await supabase
    .from('social_connections')
    .select('*')
    .eq('business_id', businessId)
    .eq('platform', 'whatsapp')
    .eq('is_active', true)
    .single();

  if (connError || !connection) {
    throw new Error('WhatsApp not connected');
  }

  const accessToken = await ensureValidMetaToken(connection, 'whatsapp');
  const phoneNumberId = connection.metadata?.phone_number_id;

  if (!phoneNumberId) {
    throw new Error('WhatsApp phone number ID missing');
  }

  const { data: conversation } = await supabase
    .from('conversations')
    .select('customer_phone')
    .eq('id', message.conversation_id)
    .single();

  if (!conversation?.customer_phone) {
    throw new Error('Customer phone number not found');
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: conversation.customer_phone,
      type: 'text',
      text: { body: message.content },
    }),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.error?.message || 'Failed to send WhatsApp message');
  }

  if (responseData.messages && responseData.messages.length > 0) {
    const whatsappMessageId = responseData.messages[0].id;
    await supabase
      .from('messages')
      .update({
        metadata: {
          ...message.metadata,
          whatsapp_message_id: whatsappMessageId,
        },
      })
      .eq('id', message.id);
  }
}

// ── TikTok ─────────────────────────────────────────────────────

export async function handleTikTokSend(
  message: Message,
  businessId: string,
  supabase: SupabaseClient
) {
  const { data: connection, error: connError } = await supabase
    .from('social_connections')
    .select('*')
    .eq('business_id', businessId)
    .eq('platform', 'tiktok')
    .eq('is_active', true)
    .single();

  if (connError || !connection) {
    throw new Error('TikTok not connected');
  }

  let accessToken = connection.access_token;

  if (!accessToken) {
    throw new Error('TikTok access token missing');
  }

  if (connection.token_expires_at) {
    const expiresAt = new Date(connection.token_expires_at);
    if (expiresAt <= new Date()) {
      if (connection.refresh_token) {
        const refreshedToken = await refreshTikTokToken(connection.refresh_token, connection.id, supabase);
        if (!refreshedToken) {
          throw new Error('TikTok token expired and refresh failed. Please reconnect your TikTok account.');
        }
        accessToken = refreshedToken;
      } else {
        throw new Error('TikTok token expired. Please reconnect your TikTok account.');
      }
    }
  }

  const { data: conversation } = await supabase
    .from('conversations')
    .select('customer_tiktok_id')
    .eq('id', message.conversation_id)
    .single();

  if (!conversation?.customer_tiktok_id) {
    throw new Error('Customer TikTok ID not found');
  }

  const url = 'https://open.tiktokapis.com/v2/dm/message/send/';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receiver_open_id: conversation.customer_tiktok_id,
      message_type: 'text',
      text: { text: message.content },
    }),
  });

  const responseData = await response.json();

  if (!response.ok || responseData.error?.code) {
    throw new Error(responseData.error?.message || 'Failed to send TikTok message');
  }

  if (responseData.data?.msg_id) {
    await supabase
      .from('messages')
      .update({
        metadata: {
          ...message.metadata,
          tiktok_message_id: responseData.data.msg_id,
        },
      })
      .eq('id', message.id);
  }
}

// ── Helpers ────────────────────────────────────────────────────

export async function checkIfSimulated(
  conversationId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data } = await supabase
    .from('messages')
    .select('metadata')
    .eq('conversation_id', conversationId)
    .contains('metadata', { simulated: true })
    .limit(1);

  return (data && data.length > 0) || false;
}

async function refreshTikTokToken(
  refreshToken: string,
  connectionId: string,
  supabase: SupabaseClient
): Promise<string | null> {
  try {
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY || '',
        client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      logger.error('Failed to refresh TikTok token', undefined, { error: data.error });
      return null;
    }

    const tokenExpiresAt = new Date(Date.now() + (data.expires_in * 1000)).toISOString();

    await supabase
      .from('social_connections')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_expires_at: tokenExpiresAt,
      })
      .eq('id', connectionId);

    return data.access_token;
  } catch (error) {
    logger.error('Error refreshing TikTok token', error);
    return null;
  }
}
