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
    const body = await request.json();

    console.log('📨 Instagram webhook received:', JSON.stringify(body, null, 2));

    // Verify signature (optional but recommended)
    const signature = request.headers.get('x-hub-signature-256');
    if (signature && process.env.META_APP_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.META_APP_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');

      if (`sha256=${expectedSignature}` !== signature) {
        console.log('❌ Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
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

      console.log(`💬 New message from ${senderId}: ${messageText}`);

      // Find which business this Instagram account belongs to
      const { data: connection } = await supabaseAdmin
        .from('social_connections')
        .select('business_id, platform_username')
        .eq('platform', 'instagram')
        .eq('platform_user_id', recipientId)
        .eq('is_active', true)
        .single();

      if (!connection) {
        console.log('⚠️ No business found for Instagram account:', recipientId);
        return;
      }

      // Fetch sender's Instagram username
      const senderInstagramId = senderId;
      let senderUsername = senderInstagramId; // Default to ID if fetch fails

      try {
        // Fetch sender's Instagram username
        const userResponse = await fetch(
          `https://graph.instagram.com/${senderInstagramId}?fields=username&access_token=${process.env.META_ACCESS_TOKEN}`
        );

        if (userResponse.ok) {
          const userData = await userResponse.json();
          senderUsername = userData.username || senderInstagramId;
        }
      } catch (error) {
        console.log('Could not fetch Instagram username, using ID');
      }

      // Find or create conversation
      let conversationId;
      const { data: existingConv } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('business_id', connection.business_id)
        .eq('customer_instagram_id', senderInstagramId)
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
        await supabaseAdmin
          .from('conversations')
          .update({
            last_message_at: new Date(timestamp).toISOString(),
            unread_count: currentUnreadCount + 1,
            status: 'open',
          })
          .eq('id', conversationId);

        console.log('📝 Updated conversation:', conversationId, 'Unread count:', currentUnreadCount + 1);
      } else {
        // Create new conversation with username
        const { data: newConv } = await supabaseAdmin
          .from('conversations')
          .insert({
            business_id: connection.business_id,
            customer_name: `@${senderUsername}`, // Use @ prefix
            customer_instagram_id: senderInstagramId,
            channel: 'instagram',
            status: 'open',
            unread_count: 1,
            last_message_at: new Date(timestamp).toISOString(),
          })
          .select('id')
          .single();

        conversationId = newConv?.id;
      }

      if (!conversationId) {
        console.log('❌ Failed to create/find conversation');
        return;
      }

      // Save message
      await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: conversationId,
          business_id: connection.business_id,
          sender_type: 'customer',
          sender_name: senderId,
          content: messageText,
          channel: 'instagram',
          is_ai_suggested: false,
          metadata: {
            instagram_message_id: messageId,
            sender_id: senderId,
            recipient_id: recipientId,
          },
        });

      console.log('✅ Message saved to database');
    }
  } catch (error) {
    console.error('❌ Error handling Instagram message:', error);
  }
}
