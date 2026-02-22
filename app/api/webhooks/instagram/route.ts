import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import crypto from 'crypto';
import { canCreateConversation, incrementConversationUsage } from '@/lib/usage/tracker';
import { logger } from '@/lib/logger';
import { ensureValidMetaToken } from '@/lib/api/meta-tokens';

// GET - Webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify token (set this to any string you want)
  const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'inboxforge_webhook_token_2025';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    logger.success('Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  } else {
    logger.error('Webhook verification failed', undefined, { mode, token: token?.substring(0, 10) + '...' });
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  }
}

// POST - Receive Instagram messages
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    logger.info('Instagram webhook received', { body });

    // Verify signature (optional but recommended)
    const signature = request.headers.get('x-hub-signature-256');
    if (signature && process.env.META_APP_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.META_APP_SECRET)
        .update(rawBody) // Use raw body, not stringified JSON
        .digest('hex');

      if (`sha256=${expectedSignature}` !== signature) {
        logger.error('Invalid webhook signature - rejecting request', undefined, {
          expected: 'sha256=' + expectedSignature,
          received: signature
        });
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }

      logger.success('Signature verified');
    }

    // Process webhook events
    if (body.object === 'instagram') {
      for (const entry of body.entry || []) {
        // Handle messaging events
        if (entry.messaging) {
          for (const event of entry.messaging) {
            await handleInstagramMessage(event);
          }
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    logger.error('Webhook error', error);
    // Still return 200 to prevent Facebook from retrying
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

async function handleInstagramMessage(event: any) {
  try {
    logger.debug('Full webhook event', { event });

    const senderId = event.sender.id;
    const recipientId = event.recipient.id; // Your Instagram account ID
    const timestamp = event.timestamp;

    // Check if it's a message
    if (event.message) {
      const messageText = event.message.text || '[Media]';
      const messageId = event.message.mid;

      logger.info('New Instagram message', { senderId, recipientId, messageText: messageText.substring(0, 100) });

      // Determine if this is an incoming message or an echo (message sent by business through Instagram)
      // For incoming: sender = customer, recipient = business
      // For echo: sender = business, recipient = customer
      // Instagram may not always send is_echo flag, so we check both ways:
      // 1. Check if is_echo flag is present
      // 2. Check if sender matches our business account (we'll verify after looking up connection)
      const hasEchoFlag = event.message.is_echo === true;

      logger.debug('Checking message direction', { hasEchoFlag });

      // First, try to find business connection assuming this is an incoming message (recipient = business)
      let { data: connection, error: connectionError } = await supabaseAdmin
        .from('social_connections')
        .select('id, business_id, platform_username, access_token, platform_user_id, token_expires_at, metadata')
        .eq('platform', 'instagram')
        .eq('platform_user_id', recipientId)
        .eq('is_active', true)
        .single();

      // If not found, try assuming this is an echo (sender = business)
      if (!connection) {
        logger.debug('Not found as incoming, trying as echo');
        const result = await supabaseAdmin
          .from('social_connections')
          .select('id, business_id, platform_username, access_token, platform_user_id, token_expires_at, metadata')
          .eq('platform', 'instagram')
          .eq('platform_user_id', senderId)
          .eq('is_active', true)
          .single();

        connection = result.data;
        connectionError = result.error;

        if (connection) {
          logger.debug('Found as echo message (sender is business)');
        }
      } else {
        logger.debug('Found as incoming message (recipient is business)');
      }

      if (!connection) {
        logger.warn('No business found for Instagram accounts', { senderId, recipientId });
        if (connectionError) {
          logger.error('Connection lookup error', connectionError);
        }
        return;
      }

      // Now determine if this is an echo based on whether sender matches business account
      const isEcho = hasEchoFlag || senderId === connection.platform_user_id;
      const businessAccountId = connection.platform_user_id;
      const customerAccountId = isEcho ? recipientId : senderId;

      logger.info('Message type determined', {
        type: isEcho ? 'ECHO (sent by business)' : 'INCOMING (from customer)',
        businessAccountId,
        customerAccountId,
        platformUsername: connection.platform_username
      });

      // Fetch customer's Instagram username using the database token (only for incoming messages)
      let customerUsername = customerAccountId; // Default to ID if fetch fails

      if (!isEcho) {
        // Only fetch username for incoming messages from customers
        try {
          // Ensure token is valid before making API call
          const validToken = await ensureValidMetaToken(connection, 'instagram');

          // Fetch customer's Instagram username using connection's access token
          // Use Facebook Graph API (not Instagram Graph API) for Instagram Business accounts
          const userResponse = await fetch(
            `https://graph.facebook.com/v21.0/${customerAccountId}?fields=username&access_token=${validToken}`
          );

          if (userResponse.ok) {
            const userData = await userResponse.json();
            customerUsername = userData.username || customerAccountId;
            logger.debug('Fetched customer username', { customerUsername });
          } else {
            const errorData = await userResponse.json();
            logger.error('Failed to fetch Instagram username', undefined, {
              status: userResponse.status,
              errorData
            });
            // Still continue with ID as username
          }
        } catch (error) {
          logger.error('Exception fetching Instagram username', error);
          // Still continue with ID as username
        }
      } else {
        logger.debug('Echo message - using existing customer from conversation');
      }

      // Find or create conversation
      let conversationId;
      const { data: existingConv, error: convLookupError } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('business_id', connection.business_id)
        .eq('customer_instagram_id', customerAccountId)
        .eq('channel', 'instagram')
        .single();

      if (existingConv) {
        conversationId = existingConv.id;

        // Get current unread count
        const { data: currentConvo } = await supabaseAdmin
          .from('conversations')
          .select('unread_count')
          .eq('id', conversationId)
          .single();

        const currentUnreadCount = currentConvo?.unread_count || 0;

        // Update conversation
        // For echo messages (sent by business), don't increment unread count
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
        } else {
          if (isEcho) {
            logger.debug('Updated conversation (echo)', { conversationId });
          } else {
            logger.debug('Updated conversation', { conversationId, unreadCount: currentUnreadCount + 1 });
          }
        }
      } else {
        // Create new conversation with username (only for incoming messages)
        if (!isEcho) {
          // Check conversation usage limit before creating
          const canCreate = await canCreateConversation(connection.business_id);
          if (!canCreate) {
            logger.warn('Conversation limit reached for business', { businessId: connection.business_id });
            // Note: We still need to store the message somehow, but won't create a new conversation
            // For now, we'll log it. In the future, you might want to create a "pending" conversation
            // or send an email notification to the business owner
            return;
          }

          const { data: newConv, error: createError } = await supabaseAdmin
            .from('conversations')
            .insert({
              business_id: connection.business_id,
              customer_name: `@${customerUsername}`, // Use @ prefix
              customer_instagram_id: customerAccountId,
              channel: 'instagram',
              status: 'open',
              unread_count: 1,
              last_message_at: new Date(timestamp).toISOString(),
            })
            .select('id')
            .single();

          if (createError) {
            logger.error('Failed to create conversation', createError);
          } else {
            logger.success('Created new conversation', { conversationId: newConv?.id });

            // Increment conversation usage counter
            const incrementSuccess = await incrementConversationUsage(connection.business_id);
            if (!incrementSuccess) {
              logger.warn('Failed to increment conversation usage counter');
            } else {
              logger.debug('Conversation usage incremented');
            }
          }

          conversationId = newConv?.id;
        } else {
          logger.warn('Echo message for non-existent conversation - this should not happen');
          return;
        }
      }

      if (!conversationId) {
        logger.error('Failed to create/find conversation');
        return;
      }

      // Check if message already exists (prevent duplicates from webhook retries)
      const { data: existingMessages } = await supabaseAdmin
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .contains('metadata', { instagram_message_id: messageId });

      if (existingMessages && existingMessages.length > 0) {
        logger.warn('Message already exists, skipping duplicate', { messageId });
        return;
      }

      // Save message
      // For echo messages: sender_type is 'business', status is 'sent'
      // For incoming messages: sender_type is 'customer', no status needed
      const { error: messageError } = await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: conversationId,
          business_id: connection.business_id,
          sender_type: isEcho ? 'business' : 'customer',
          sender_name: isEcho ? connection.platform_username : customerAccountId,
          content: messageText,
          channel: 'instagram',
          is_ai_suggested: false,
          status: isEcho ? 'sent' : undefined,
          sent_at: isEcho ? new Date(timestamp).toISOString() : undefined,
          metadata: {
            instagram_message_id: messageId,
            sender_id: senderId,
            recipient_id: recipientId,
            is_echo: isEcho,
          },
        });

      if (messageError) {
        // Check if this is a duplicate constraint violation (PostgreSQL error code 23505)
        if (messageError.code === '23505' || messageError.message?.includes('duplicate') || messageError.message?.includes('idx_messages_instagram_message_id')) {
          logger.warn('Duplicate message blocked by database constraint (expected for race conditions)', { messageId });
          return; // Silently ignore duplicates
        }
        logger.error('Failed to save message', messageError);
      } else {
        if (isEcho) {
          logger.success('Echo message saved to database (message you sent through Instagram)');
        } else {
          logger.success('Customer message saved to database');

          // Trigger auto-notes for customer messages (fire and forget)
          if (process.env.NEXT_PUBLIC_APP_URL) {
            fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/conversations/${conversationId}/auto-notes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }).catch(err => {
              logger.debug('Auto-notes failed (non-critical)', { error: err.message });
            });
          } else {
            logger.warn('NEXT_PUBLIC_APP_URL not set - skipping auto-notes');
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error handling Instagram message', error);
  }
}
