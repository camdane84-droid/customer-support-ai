import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import crypto from 'crypto';
import { canCreateConversation, incrementConversationUsage } from '@/lib/usage/tracker';
import { logger } from '@/lib/logger';

// GET - Webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Use same verify token as Instagram
  const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'inboxforge_webhook_token_2025';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    logger.success('WhatsApp webhook verified');
    return new NextResponse(challenge, { status: 200 });
  } else {
    logger.error('WhatsApp webhook verification failed', undefined, { mode, token: token?.substring(0, 10) + '...' });
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  }
}

// POST - Receive WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    logger.info('WhatsApp webhook received', { body });

    // Verify signature
    const signature = request.headers.get('x-hub-signature-256');
    if (signature && process.env.META_APP_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.META_APP_SECRET)
        .update(rawBody)
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
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        // Handle changes (messages, status updates, etc.)
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              await handleWhatsAppChange(change.value);
            }
          }
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    logger.error('WhatsApp webhook error', error);
    // Still return 200 to prevent Facebook from retrying
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

async function handleWhatsAppChange(value: any) {
  try {
    logger.debug('WhatsApp change event', { value });

    // Handle incoming messages
    if (value.messages && value.messages.length > 0) {
      for (const message of value.messages) {
        await handleWhatsAppMessage(message, value.metadata);
      }
    }

    // Handle message status updates (sent, delivered, read)
    if (value.statuses && value.statuses.length > 0) {
      for (const status of value.statuses) {
        await handleWhatsAppStatus(status, value.metadata);
      }
    }
  } catch (error) {
    logger.error('Error handling WhatsApp change', error);
  }
}

async function handleWhatsAppMessage(message: any, metadata: any) {
  try {
    const phoneNumberId = metadata.phone_number_id; // Your business phone number ID
    const customerPhone = message.from; // Customer's phone number
    const messageId = message.id;
    const timestamp = parseInt(message.timestamp) * 1000; // Convert to milliseconds

    // Get message text (WhatsApp supports multiple message types)
    let messageText = '[Media]';
    if (message.type === 'text') {
      messageText = message.text.body;
    } else if (message.type === 'image') {
      messageText = message.image.caption || '[Image]';
    } else if (message.type === 'video') {
      messageText = message.video.caption || '[Video]';
    } else if (message.type === 'audio') {
      messageText = '[Audio]';
    } else if (message.type === 'document') {
      messageText = message.document.filename || '[Document]';
    } else if (message.type === 'location') {
      messageText = '[Location]';
    } else if (message.type === 'contacts') {
      messageText = '[Contact]';
    }

    logger.info('New WhatsApp message', {
      customerPhone,
      phoneNumberId,
      messageText: messageText.substring(0, 100),
      messageType: message.type
    });

    // Find business connection by phone_number_id
    const { data: connection, error: connectionError } = await supabaseAdmin
      .from('social_connections')
      .select('business_id, platform_username, access_token, platform_user_id, metadata')
      .eq('platform', 'whatsapp')
      .eq('is_active', true)
      .filter('metadata->>phone_number_id', 'eq', phoneNumberId)
      .single();

    if (!connection) {
      logger.warn('No business found for WhatsApp phone number', { phoneNumberId });
      if (connectionError) {
        logger.error('Connection lookup error', connectionError);
      }
      return;
    }

    logger.debug('Found business connection', {
      businessId: connection.business_id,
      platformUsername: connection.platform_username
    });

    // Find or create conversation
    let conversationId;
    const { data: existingConv, error: convLookupError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('business_id', connection.business_id)
      .eq('customer_phone', customerPhone)
      .eq('channel', 'whatsapp')
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
      const { error: updateError } = await supabaseAdmin
        .from('conversations')
        .update({
          last_message_at: new Date(timestamp).toISOString(),
          unread_count: currentUnreadCount + 1,
          status: 'open',
        })
        .eq('id', conversationId);

      if (updateError) {
        logger.error('Failed to update conversation', updateError, { conversationId });
      } else {
        logger.debug('Updated conversation', { conversationId, unreadCount: currentUnreadCount + 1 });
      }
    } else {
      // Create new conversation
      // Check conversation usage limit before creating
      const canCreate = await canCreateConversation(connection.business_id);
      if (!canCreate) {
        logger.warn('Conversation limit reached for business', { businessId: connection.business_id });
        return;
      }

      // Get customer name from WhatsApp profile if available
      let customerName = customerPhone; // Default to phone number
      if (message.contacts && message.contacts.length > 0) {
        const contact = message.contacts[0];
        customerName = contact.profile?.name || customerPhone;
      }

      const { data: newConv, error: createError } = await supabaseAdmin
        .from('conversations')
        .insert({
          business_id: connection.business_id,
          customer_name: customerName,
          customer_phone: customerPhone,
          channel: 'whatsapp',
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
    }

    if (!conversationId) {
      logger.error('Failed to create/find conversation');
      return;
    }

    // Check if message already exists
    const { data: existingMessages } = await supabaseAdmin
      .from('messages')
      .select('id')
      .contains('metadata', { whatsapp_message_id: messageId });

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
        sender_type: 'customer',
        sender_name: customerPhone,
        content: messageText,
        channel: 'whatsapp',
        is_ai_suggested: false,
        metadata: {
          whatsapp_message_id: messageId,
          message_type: message.type,
          phone_number_id: phoneNumberId,
          customer_phone: customerPhone,
        },
      });

    if (messageError) {
      // Check if this is a duplicate constraint violation
      if (messageError.code === '23505' || messageError.message?.includes('duplicate')) {
        logger.warn('Duplicate message blocked by database constraint', { messageId });
        return;
      }
      logger.error('Failed to save message', messageError);
    } else {
      logger.success('WhatsApp message saved to database');

      // Trigger auto-notes (fire and forget)
      if (process.env.NEXT_PUBLIC_APP_URL) {
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/conversations/${conversationId}/auto-notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(err => {
          logger.debug('Auto-notes failed (non-critical)', { error: err.message });
        });
      }
    }
  } catch (error) {
    logger.error('Error handling WhatsApp message', error);
  }
}

async function handleWhatsAppStatus(status: any, metadata: any) {
  try {
    const messageId = status.id;
    const newStatus = status.status; // sent, delivered, read, failed
    const timestamp = parseInt(status.timestamp) * 1000;

    logger.info('WhatsApp status update', { messageId, status: newStatus });

    // Find message by WhatsApp message ID
    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('id, conversation_id')
      .contains('metadata', { whatsapp_message_id: messageId })
      .single();

    if (!message) {
      logger.debug('Message not found for status update', { messageId });
      return;
    }

    // Map WhatsApp status to our status
    let ourStatus: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' = 'sent';
    if (newStatus === 'delivered') {
      ourStatus = 'delivered';
    } else if (newStatus === 'read') {
      ourStatus = 'read';
    } else if (newStatus === 'failed') {
      ourStatus = 'failed';
    }

    // Update message status
    const { error: updateError } = await supabaseAdmin
      .from('messages')
      .update({
        status: ourStatus,
        delivered_at: ['delivered', 'read'].includes(newStatus) ? new Date(timestamp).toISOString() : undefined,
        read_at: newStatus === 'read' ? new Date(timestamp).toISOString() : undefined,
      })
      .eq('id', message.id);

    if (updateError) {
      logger.error('Failed to update message status', updateError);
    } else {
      logger.debug('Message status updated', { messageId, status: ourStatus });
    }
  } catch (error) {
    logger.error('Error handling WhatsApp status', error);
  }
}
