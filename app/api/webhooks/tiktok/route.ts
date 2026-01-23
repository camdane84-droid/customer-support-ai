import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import crypto from 'crypto';
import { canCreateConversation, incrementConversationUsage } from '@/lib/usage/tracker';
import { logger } from '@/lib/logger';

// GET - Webhook verification (TikTok uses challenge-response verification)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const challenge = searchParams.get('challenge');

  // TikTok sends a challenge parameter that we need to return
  if (challenge) {
    logger.success('TikTok webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  logger.error('TikTok webhook verification failed - no challenge provided');
  return NextResponse.json({ error: 'Missing challenge parameter' }, { status: 400 });
}

// POST - Receive TikTok messages
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    logger.info('TikTok webhook received', { body });

    // Verify webhook signature if configured
    const signature = request.headers.get('x-tiktok-signature');
    if (signature && process.env.TIKTOK_CLIENT_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.TIKTOK_CLIENT_SECRET)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        logger.error('Invalid TikTok webhook signature', undefined, {
          expected: expectedSignature,
          received: signature
        });
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }

      logger.success('TikTok signature verified');
    }

    // Process webhook events
    // TikTok sends events with an 'event' field indicating the type
    const eventType = body.event;

    if (eventType === 'receive_message' || eventType === 'direct_message') {
      await handleTikTokMessage(body);
    } else {
      logger.debug('Unhandled TikTok event type', { eventType });
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    logger.error('TikTok webhook error', error);
    // Still return 200 to prevent TikTok from retrying
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

async function handleTikTokMessage(event: any) {
  try {
    logger.debug('Processing TikTok message event', { event });

    // Extract message data from TikTok webhook payload
    // TikTok's payload structure for DM webhooks
    const content = event.content || event.message?.content;
    const senderId = content?.sender?.open_id || event.from_user_id;
    const recipientId = content?.receiver?.open_id || event.to_user_id;
    const messageText = content?.text || event.message?.text || '[Media]';
    const messageId = content?.msg_id || event.msg_id || `tiktok_${Date.now()}`;
    const timestamp = event.create_time || Date.now();

    if (!senderId) {
      logger.warn('TikTok message missing sender ID');
      return;
    }

    logger.info('New TikTok message', {
      senderId,
      recipientId,
      messageText: messageText.substring(0, 100)
    });

    // Find the business connection (recipient should match our connected TikTok account)
    let { data: connection, error: connectionError } = await supabaseAdmin
      .from('social_connections')
      .select('business_id, platform_username, access_token, platform_user_id')
      .eq('platform', 'tiktok')
      .eq('platform_user_id', recipientId)
      .eq('is_active', true)
      .single();

    // If not found as recipient, try as sender (for echo messages)
    let isEcho = false;
    if (!connection) {
      const result = await supabaseAdmin
        .from('social_connections')
        .select('business_id, platform_username, access_token, platform_user_id')
        .eq('platform', 'tiktok')
        .eq('platform_user_id', senderId)
        .eq('is_active', true)
        .single();

      connection = result.data;
      connectionError = result.error;

      if (connection) {
        isEcho = true;
        logger.debug('Found as echo message (sender is business)');
      }
    }

    if (!connection) {
      logger.warn('No business found for TikTok accounts', { senderId, recipientId });
      return;
    }

    const businessAccountId = connection.platform_user_id;
    const customerAccountId = isEcho ? recipientId : senderId;

    logger.info('Message type determined', {
      type: isEcho ? 'ECHO (sent by business)' : 'INCOMING (from customer)',
      businessAccountId,
      customerAccountId,
    });

    // Get customer username (if available from the webhook payload)
    let customerUsername = content?.sender?.display_name || customerAccountId;

    // Find or create conversation
    let conversationId;
    const { data: existingConv } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('business_id', connection.business_id)
      .eq('customer_tiktok_id', customerAccountId)
      .eq('channel', 'tiktok')
      .single();

    if (existingConv) {
      conversationId = existingConv.id;

      const { data: currentConvo } = await supabaseAdmin
        .from('conversations')
        .select('unread_count')
        .eq('id', conversationId)
        .single();

      const currentUnreadCount = currentConvo?.unread_count || 0;

      const { error: updateError } = await supabaseAdmin
        .from('conversations')
        .update({
          last_message_at: new Date(timestamp).toISOString(),
          unread_count: isEcho ? currentUnreadCount : currentUnreadCount + 1,
          status: 'open',
        })
        .eq('id', conversationId);

      if (updateError) {
        logger.error('Failed to update conversation', updateError, { conversationId });
      }
    } else if (!isEcho) {
      // Create new conversation only for incoming messages
      const canCreate = await canCreateConversation(connection.business_id);
      if (!canCreate) {
        logger.warn('Conversation limit reached for business', { businessId: connection.business_id });
        return;
      }

      const { data: newConv, error: createError } = await supabaseAdmin
        .from('conversations')
        .insert({
          business_id: connection.business_id,
          customer_name: `@${customerUsername}`,
          customer_tiktok_id: customerAccountId,
          channel: 'tiktok',
          status: 'open',
          unread_count: 1,
          last_message_at: new Date(timestamp).toISOString(),
        })
        .select('id')
        .single();

      if (createError) {
        logger.error('Failed to create conversation', createError);
        return;
      }

      logger.success('Created new conversation', { conversationId: newConv?.id });

      const incrementSuccess = await incrementConversationUsage(connection.business_id);
      if (!incrementSuccess) {
        logger.warn('Failed to increment conversation usage counter');
      }

      conversationId = newConv?.id;
    } else {
      logger.warn('Echo message for non-existent conversation');
      return;
    }

    if (!conversationId) {
      logger.error('Failed to create/find conversation');
      return;
    }

    // Check for duplicate messages
    const { data: existingMessages } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .contains('metadata', { tiktok_message_id: messageId });

    if (existingMessages && existingMessages.length > 0) {
      logger.warn('Message already exists, skipping duplicate', { messageId });
      return;
    }

    // Save message
    const { error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        business_id: connection.business_id,
        sender_type: isEcho ? 'business' : 'customer',
        sender_name: isEcho ? connection.platform_username : customerUsername,
        content: messageText,
        channel: 'tiktok',
        is_ai_suggested: false,
        status: isEcho ? 'sent' : undefined,
        sent_at: isEcho ? new Date(timestamp).toISOString() : undefined,
        metadata: {
          tiktok_message_id: messageId,
          sender_id: senderId,
          recipient_id: recipientId,
          is_echo: isEcho,
        },
      });

    if (messageError) {
      if (messageError.code === '23505' || messageError.message?.includes('duplicate')) {
        logger.warn('Duplicate message blocked by database constraint', { messageId });
        return;
      }
      logger.error('Failed to save message', messageError);
    } else {
      if (isEcho) {
        logger.success('Echo message saved to database');
      } else {
        logger.success('Customer message saved to database');

        // Trigger auto-notes for customer messages
        if (process.env.NEXT_PUBLIC_APP_URL) {
          fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/conversations/${conversationId}/auto-notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }).catch(err => {
            logger.debug('Auto-notes failed (non-critical)', { error: err.message });
          });
        }
      }
    }
  } catch (error) {
    logger.error('Error handling TikTok message', error);
  }
}
