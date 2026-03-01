import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/api/email';
import { logError } from '@/lib/services/errorLogger';
import type { Message } from '@/lib/api/supabase';
import { ensureValidMetaToken } from '@/lib/api/meta-tokens';

export async function POST(request: NextRequest) {
  try {
    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // Get the failed message
    const { data: message, error } = await supabaseServer
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (message.status !== 'failed') {
      return NextResponse.json(
        { error: 'Message is not in failed state' },
        { status: 400 }
      );
    }

    // Update to sending status
    await supabaseServer
      .from('messages')
      .update({
        status: 'sending',
        error_message: null,
        failed_at: null,
      })
      .eq('id', messageId);

    // Try sending again
    try {
      if (message.channel === 'email') {
        await handleEmailSend(message, message.business_id);
      } else if (message.channel === 'instagram') {
        await handleInstagramSend(message, message.business_id);
      } else if (message.channel === 'whatsapp') {
        await handleWhatsAppSend(message, message.business_id);
      }

      // Update to sent
      await supabaseServer
        .from('messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      logger.info(`✅ Message ${messageId} retry successful`);
      return NextResponse.json({ success: true });
    } catch (sendError: any) {
      // Failed again
      await supabaseServer
        .from('messages')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          error_message: sendError.message,
        })
        .eq('id', messageId);

      await logError({
        businessId: message.business_id,
        errorType: `${message.channel}_retry_failed`,
        errorMessage: sendError.message,
        context: {
          message_id: messageId,
          conversation_id: message.conversation_id,
        },
      });

      logger.error(`Failed to retry message ${messageId}:`, sendError);
      throw sendError;
    }
  } catch (error: any) {
    logger.error('Error in retry API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retry message' },
      { status: 500 }
    );
  }
}

async function handleEmailSend(message: Message, businessId: string) {
  // Only send if Resend is configured
  if (!process.env.RESEND_API_KEY) {
    logger.info('Email reply saved (Resend not configured)');
    throw new Error('Email service not configured. Please add RESEND_API_KEY to your environment variables.');
  }

  // Get conversation details
  const { data: conversation, error: convError } = await supabaseServer
    .from('conversations')
    .select('customer_email, customer_name')
    .eq('id', message.conversation_id)
    .single();

  if (convError) {
    logger.error('Failed to fetch conversation:', convError);
    throw new Error(`Failed to fetch conversation: ${convError.message}`);
  }

  // Get business details
  const { data: business, error: bizError } = await supabaseServer
    .from('businesses')
    .select('email, name')
    .eq('id', businessId)
    .single();

  if (bizError) {
    logger.error('Failed to fetch business:', bizError);
    throw new Error(`Failed to fetch business: ${bizError.message}`);
  }

  if (!conversation?.customer_email) {
    throw new Error('Customer email not found in conversation');
  }

  if (!business?.email) {
    throw new Error('Business email not found');
  }

  // Send from the business's mail subdomain address so replies route back through SendGrid
  // e.g. acme@inbox-forge.com → acme@mail.inbox-forge.com
  const fromEmail = business.email.replace('@', '@mail.');
  logger.info(`📧 Sending email from ${fromEmail} to ${conversation.customer_email}`);

  try {
    await sendEmail({
      to: conversation.customer_email,
      from: `${business.name} <${fromEmail}>`,
      subject: `Re: Message from ${business.name}`,
      text: message.content,
    });
    logger.info('✅ Email sent successfully');
  } catch (emailError: any) {
    logger.error('Resend error:', emailError);
    throw new Error(`Email delivery failed: ${emailError.message}`);
  }
}

async function handleInstagramSend(message: Message, businessId: string) {
  logger.info('📸 Sending Instagram message...');

  // Get the Instagram connection with access token
  const { data: connection, error: connError } = await supabaseServer
    .from('social_connections')
    .select('*')
    .eq('business_id', businessId)
    .eq('platform', 'instagram')
    .eq('is_active', true)
    .single();

  if (connError || !connection) {
    logger.error('No Instagram connection found:', connError);
    throw new Error('Instagram not connected');
  }

  // Ensure token is valid, refreshing if needed
  const accessToken = await ensureValidMetaToken(connection, 'instagram');

  // Get conversation for recipient Instagram ID
  const { data: conversation } = await supabaseServer
    .from('conversations')
    .select('customer_instagram_id')
    .eq('id', message.conversation_id)
    .single();

  if (!conversation?.customer_instagram_id) {
    throw new Error('Customer Instagram ID not found');
  }

  logger.info('📤 Sending Instagram DM...');
  logger.info('To Instagram ID:', conversation.customer_instagram_id);
  logger.info('From Account ID:', connection.platform_user_id);

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
  logger.info('Instagram API response:', responseData);

  if (!response.ok) {
    logger.error('❌ Instagram send failed:', responseData);
    throw new Error(responseData.error?.message || 'Failed to send Instagram message');
  }

  logger.info('✅ Instagram message sent!');
}

async function handleWhatsAppSend(message: Message, businessId: string) {
  logger.info('💬 Sending WhatsApp message...');

  // Get the WhatsApp connection with access token
  const { data: connection, error: connError } = await supabaseServer
    .from('social_connections')
    .select('*')
    .eq('business_id', businessId)
    .eq('platform', 'whatsapp')
    .eq('is_active', true)
    .single();

  if (connError || !connection) {
    logger.error('No WhatsApp connection found:', connError);
    throw new Error('WhatsApp not connected');
  }

  // Ensure token is valid, refreshing if needed
  const accessToken = await ensureValidMetaToken(connection, 'whatsapp');
  const phoneNumberId = connection.metadata?.phone_number_id;

  if (!phoneNumberId) {
    logger.error('No phone number ID in connection metadata');
    throw new Error('WhatsApp phone number ID missing');
  }

  logger.info('Using phone number ID:', phoneNumberId);

  // Get conversation for recipient phone number
  const { data: conversation } = await supabaseServer
    .from('conversations')
    .select('customer_phone')
    .eq('id', message.conversation_id)
    .single();

  if (!conversation?.customer_phone) {
    throw new Error('Customer phone number not found');
  }

  logger.info('📤 Sending WhatsApp message to:', conversation.customer_phone);

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
  logger.info('WhatsApp API response:', responseData);

  if (!response.ok) {
    logger.error('❌ WhatsApp send failed:', responseData);
    throw new Error(responseData.error?.message || 'Failed to send WhatsApp message');
  }

  // Store the WhatsApp message ID for status tracking
  if (responseData.messages && responseData.messages.length > 0) {
    const whatsappMessageId = responseData.messages[0].id;

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

  logger.info('✅ WhatsApp message sent!');
}
