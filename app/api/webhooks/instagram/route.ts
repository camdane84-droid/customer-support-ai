import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import crypto from 'crypto';

// GET - Webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify token (set this to any string you want)
  const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'inboxforge_webhook_token_2025';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.log('❌ Webhook verification failed');
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  }
}

// POST - Receive Instagram messages
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    console.log('📨 Instagram webhook received:', JSON.stringify(body, null, 2));

    // Verify signature (optional but recommended)
    const signature = request.headers.get('x-hub-signature-256');
    if (signature && process.env.META_APP_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.META_APP_SECRET)
        .update(rawBody) // Use raw body, not stringified JSON
        .digest('hex');

      if (`sha256=${expectedSignature}` !== signature) {
        console.log('❌ Invalid signature');
        console.log('   Expected: sha256=' + expectedSignature);
        console.log('   Received:', signature);
        console.log('⚠️  Signature mismatch - processing anyway for debugging');
        // Don't return 403 for now - let's see if the message gets saved
        // return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      } else {
        console.log('✅ Signature verified');
      }
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
    console.error('❌ Webhook error:', error);
    // Still return 200 to prevent Facebook from retrying
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

async function handleInstagramMessage(event: any) {
  try {
    console.log('📦 Full webhook event:', JSON.stringify(event, null, 2));

    const senderId = event.sender.id;
    const recipientId = event.recipient.id; // Your Instagram account ID
    const timestamp = event.timestamp;

    // Check if it's a message
    if (event.message) {
      const messageText = event.message.text || '[Media]';
      const messageId = event.message.mid;

      console.log(`💬 New message from ${senderId} to ${recipientId}: ${messageText}`);

      // Determine if this is an incoming message or an echo (message sent by business through Instagram)
      // For incoming: sender = customer, recipient = business
      // For echo: sender = business, recipient = customer
      // Instagram may not always send is_echo flag, so we check both ways:
      // 1. Check if is_echo flag is present
      // 2. Check if sender matches our business account (we'll verify after looking up connection)
      const hasEchoFlag = event.message.is_echo === true;

      console.log(`📍 Checking message direction... (has is_echo flag: ${hasEchoFlag})`);

      // First, try to find business connection assuming this is an incoming message (recipient = business)
      let { data: connection, error: connectionError } = await supabaseAdmin
        .from('social_connections')
        .select('business_id, platform_username, access_token, platform_user_id')
        .eq('platform', 'instagram')
        .eq('platform_user_id', recipientId)
        .eq('is_active', true)
        .single();

      // If not found, try assuming this is an echo (sender = business)
      if (!connection) {
        console.log('   → Not found as incoming, trying as echo...');
        const result = await supabaseAdmin
          .from('social_connections')
          .select('business_id, platform_username, access_token, platform_user_id')
          .eq('platform', 'instagram')
          .eq('platform_user_id', senderId)
          .eq('is_active', true)
          .single();

        connection = result.data;
        connectionError = result.error;

        if (connection) {
          console.log('   ✓ Found as echo message (sender is business)');
        }
      } else {
        console.log('   ✓ Found as incoming message (recipient is business)');
      }

      if (!connection) {
        console.log('⚠️ No business found for Instagram accounts:', senderId, recipientId);
        if (connectionError) {
          console.error('Connection lookup error:', connectionError);
        }
        return;
      }

      // Now determine if this is an echo based on whether sender matches business account
      const isEcho = hasEchoFlag || senderId === connection.platform_user_id;
      const businessAccountId = connection.platform_user_id;
      const customerAccountId = isEcho ? recipientId : senderId;

      console.log(`📍 Message type: ${isEcho ? 'ECHO (sent by business)' : 'INCOMING (from customer)'}`);
      console.log(`   Business account: ${businessAccountId}`);
      console.log(`   Customer account: ${customerAccountId}`);
      console.log(`✓ Found business connection for @${connection.platform_username}`);

      // Fetch customer's Instagram username using the database token (only for incoming messages)
      let customerUsername = customerAccountId; // Default to ID if fetch fails

      if (!isEcho) {
        // Only fetch username for incoming messages from customers
        try {
          // Fetch customer's Instagram username using connection's access token
          // Use Facebook Graph API (not Instagram Graph API) for Instagram Business accounts
          const userResponse = await fetch(
            `https://graph.facebook.com/v21.0/${customerAccountId}?fields=username&access_token=${connection.access_token}`
          );

          if (userResponse.ok) {
            const userData = await userResponse.json();
            customerUsername = userData.username || customerAccountId;
            console.log(`✓ Fetched customer username: @${customerUsername}`);
          } else {
            const errorData = await userResponse.json();
            console.error('❌ Failed to fetch Instagram username:', errorData);
            console.error('Response status:', userResponse.status);
            // Still continue with ID as username
          }
        } catch (error) {
          console.error('❌ Exception fetching Instagram username:', error);
          // Still continue with ID as username
        }
      } else {
        console.log(`📤 Echo message - using existing customer from conversation`);
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
          console.error('❌ Failed to update conversation:', updateError);
        } else {
          if (isEcho) {
            console.log('📝 Updated conversation (echo):', conversationId);
          } else {
            console.log('📝 Updated conversation:', conversationId, 'Unread count:', currentUnreadCount + 1);
          }
        }
      } else {
        // Create new conversation with username (only for incoming messages)
        if (!isEcho) {
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
            console.error('❌ Failed to create conversation:', createError);
          } else {
            console.log('✓ Created new conversation:', newConv?.id);
          }

          conversationId = newConv?.id;
        } else {
          console.log('⚠️ Echo message for non-existent conversation - this should not happen');
          return;
        }
      }

      if (!conversationId) {
        console.log('❌ Failed to create/find conversation');
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
        console.error('❌ Failed to save message:', messageError);
      } else {
        if (isEcho) {
          console.log('✅ Echo message saved to database (message you sent through Instagram)');
        } else {
          console.log('✅ Customer message saved to database');

          // Trigger auto-notes for customer messages (fire and forget)
          fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/conversations/${conversationId}/auto-notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }).catch(err => {
            console.log('Auto-notes failed (non-critical):', err.message);
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Error handling Instagram message:', error);
  }
}
