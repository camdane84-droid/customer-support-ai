import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { sendEmail } from '@/lib/api/email';
import { logError } from '@/lib/services/errorLogger';
import { authenticateRequest } from '@/lib/api/auth-middleware';
import type { Message } from '@/lib/api/supabase';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const message = await request.json();

    // Authenticate and authorize - verify user owns this business
    const auth = await authenticateRequest(request, message.business_id);
    if (!auth.success) {
      logger.error('[MESSAGES] Authentication failed', undefined, { businessId: message.business_id });
      return auth.response;
    }

    logger.info('[MESSAGES] User authenticated', {
      userId: auth.data.userId,
      businessId: auth.data.businessId,
      role: auth.data.role,
      channel: message.channel
    });

    // Save message to database with 'sending' status if it's a business reply
    const messageData = {
      ...message,
      status: message.sender_type === 'business' ? 'sending' : 'sent',
      sent_at: message.sender_type === 'customer' ? new Date().toISOString() : null,
    };

    const { data, error } = await supabaseServer
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      await logError({
        businessId: message.business_id,
        errorType: 'message_creation_failed',
        errorMessage: error.message,
        context: { message },
      });
      throw error;
    }

    // Update conversation's last_message_at
    await supabaseServer
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', message.conversation_id);

    // If this is a customer message, trigger auto-notes (fire and forget)
    if (message.sender_type === 'customer' && process.env.NEXT_PUBLIC_APP_URL) {
      // Don't await - let it run in background
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/conversations/${message.conversation_id}/auto-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {
        // Auto-notes failure is non-critical
      });
    }

    // If this is a business reply, try to send it
    if (message.sender_type === 'business') {
      try {
        if (message.channel === 'email') {
          await handleEmailSend(data, message.business_id);
        } else if (message.channel === 'instagram') {
          await handleInstagramSend(data, message.business_id);
        } else if (message.channel === 'whatsapp') {
          await handleWhatsAppSend(data, message.business_id);
        } else if (message.channel === 'tiktok') {
          await handleTikTokSend(data, message.business_id);
        }

        // Update status to sent
        await supabaseServer
          .from('messages')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', data.id);
      } catch (sendError: any) {
        // Update status to failed
        await supabaseServer
          .from('messages')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
            error_message: sendError.message,
          })
          .eq('id', data.id);

        await logError({
          businessId: message.business_id,
          errorType: `${message.channel}_send_failed`,
          errorMessage: sendError.message,
          context: {
            message_id: data.id,
            conversation_id: message.conversation_id,
          },
        });

        // Don't throw - message is saved, just delivery failed
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

async function handleEmailSend(message: Message, businessId: string) {
  // Only send if SendGrid is configured
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_API_KEY.startsWith('SG.')) {
    throw new Error('Email service not configured. Please add SENDGRID_API_KEY to your environment variables.');
  }

  // Get conversation details
  const { data: conversation, error: convError } = await supabaseServer
    .from('conversations')
    .select('customer_email, customer_name')
    .eq('id', message.conversation_id)
    .single();

  if (convError) {
    throw new Error(`Failed to fetch conversation: ${convError.message}`);
  }

  // Get business details
  const { data: business, error: bizError } = await supabaseServer
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
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'hello@inbox-forge.com';
    await sendEmail({
      to: conversation.customer_email,
      from: fromEmail,
      subject: `Re: Message from ${business.name}`,
      text: message.content,
    });
  } catch (emailError: any) {
    throw new Error(`Email delivery failed: ${emailError.message}`);
  }
}

async function handleInstagramSend(message: Message, businessId: string) {
  // Get the Instagram connection with access token
  const { data: connection, error: connError } = await supabaseServer
    .from('social_connections')
    .select('*')
    .eq('business_id', businessId)
    .eq('platform', 'instagram')
    .eq('is_active', true)
    .single();

  if (connError || !connection) {
    throw new Error('Instagram not connected');
  }

  // Use access token from database, or fall back to env variable
  const accessToken = connection.access_token || process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('Instagram access token missing');
  }

  // Get conversation for recipient Instagram ID
  const { data: conversation } = await supabaseServer
    .from('conversations')
    .select('customer_instagram_id')
    .eq('id', message.conversation_id)
    .single();

  if (!conversation?.customer_instagram_id) {
    throw new Error('Customer Instagram ID not found');
  }

  // Use Facebook Graph API for Instagram Business messaging
  const url = `https://graph.facebook.com/v21.0/${connection.platform_user_id}/messages?access_token=${accessToken}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: {
        id: conversation.customer_instagram_id,
      },
      message: {
        text: message.content,
      },
    }),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.error?.message || 'Failed to send Instagram message');
  }
}

async function handleWhatsAppSend(message: Message, businessId: string) {
  // Get the WhatsApp connection with access token
  const { data: connection, error: connError } = await supabaseServer
    .from('social_connections')
    .select('*')
    .eq('business_id', businessId)
    .eq('platform', 'whatsapp')
    .eq('is_active', true)
    .single();

  if (connError || !connection) {
    throw new Error('WhatsApp not connected');
  }

  const accessToken = connection.access_token;
  const phoneNumberId = connection.metadata?.phone_number_id;

  if (!accessToken) {
    throw new Error('WhatsApp access token missing');
  }

  if (!phoneNumberId) {
    throw new Error('WhatsApp phone number ID missing');
  }

  // Get conversation for recipient phone number
  const { data: conversation } = await supabaseServer
    .from('conversations')
    .select('customer_phone')
    .eq('id', message.conversation_id)
    .single();

  if (!conversation?.customer_phone) {
    throw new Error('Customer phone number not found');
  }

  // Use WhatsApp Cloud API to send message
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
      text: {
        body: message.content,
      },
    }),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.error?.message || 'Failed to send WhatsApp message');
  }

  // Store the WhatsApp message ID for status tracking
  if (responseData.messages && responseData.messages.length > 0) {
    const whatsappMessageId = responseData.messages[0].id;

    // Update message metadata with WhatsApp message ID
    await supabaseServer
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

async function handleTikTokSend(message: Message, businessId: string) {
  // Get the TikTok connection with access token
  const { data: connection, error: connError } = await supabaseServer
    .from('social_connections')
    .select('*')
    .eq('business_id', businessId)
    .eq('platform', 'tiktok')
    .eq('is_active', true)
    .single();

  if (connError || !connection) {
    throw new Error('TikTok not connected');
  }

  const accessToken = connection.access_token;

  if (!accessToken) {
    throw new Error('TikTok access token missing');
  }

  // Check if token is expired and refresh if needed
  if (connection.token_expires_at) {
    const expiresAt = new Date(connection.token_expires_at);
    if (expiresAt <= new Date()) {
      // Token expired, try to refresh
      if (connection.refresh_token) {
        const refreshedToken = await refreshTikTokToken(connection.refresh_token, connection.id);
        if (!refreshedToken) {
          throw new Error('TikTok token expired and refresh failed. Please reconnect your TikTok account.');
        }
      } else {
        throw new Error('TikTok token expired. Please reconnect your TikTok account.');
      }
    }
  }

  // Get conversation for recipient TikTok ID
  const { data: conversation } = await supabaseServer
    .from('conversations')
    .select('customer_tiktok_id')
    .eq('id', message.conversation_id)
    .single();

  if (!conversation?.customer_tiktok_id) {
    throw new Error('Customer TikTok ID not found');
  }

  // Use TikTok Direct Message API to send message
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
      text: {
        text: message.content,
      },
    }),
  });

  const responseData = await response.json();

  if (!response.ok || responseData.error?.code) {
    throw new Error(responseData.error?.message || 'Failed to send TikTok message');
  }

  // Store the TikTok message ID for tracking
  if (responseData.data?.msg_id) {
    await supabaseServer
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

async function refreshTikTokToken(refreshToken: string, connectionId: string): Promise<string | null> {
  try {
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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

    // Update the connection with new tokens
    const tokenExpiresAt = new Date(Date.now() + (data.expires_in * 1000)).toISOString();

    await supabaseServer
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
