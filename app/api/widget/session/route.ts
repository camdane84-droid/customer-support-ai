import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { canCreateConversation, incrementConversationUsage } from '@/lib/usage/tracker';
import { generateAutoNotes } from '@/lib/ai/auto-notes';
import { sendAutoReply } from '@/lib/ai/send-auto-reply';
import { classifyNewMessage } from '@/lib/ai/classify';
import {
  generateSessionToken,
  hashSessionToken,
  isValidWidgetKey,
  sanitizeVisitorField,
  validateMessageContent,
  CHAT_NAME_MAX_LENGTH,
  CHAT_EMAIL_MAX_LENGTH,
} from '@/lib/chat-widget';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * Start a chat session: creates the conversation and first message, and
 * returns the visitor's bearer token. Public — authenticated by widget key
 * plus usage limits, like inbound webhooks.
 */
export async function POST(request: NextRequest) {
  try {
    // Each session creates a conversation (usage-counted, AI-processed) —
    // keep this strict per client
    if (!rateLimit(`widget-session:${getClientIp(request)}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const key = typeof body.key === 'string' ? body.key : null;
    if (!isValidWidgetKey(key)) {
      return NextResponse.json({ error: 'Invalid widget key' }, { status: 400 });
    }

    const validated = validateMessageContent(body.message);
    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const visitorName = sanitizeVisitorField(body.name, CHAT_NAME_MAX_LENGTH);
    const visitorEmail = sanitizeVisitorField(body.email, CHAT_EMAIL_MAX_LENGTH);
    if (visitorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const { data: business } = await supabaseServer
      .from('businesses')
      .select('id, name, widget_enabled, subscription_tier')
      .eq('widget_key', key)
      .single();

    // Live chat is a Pro feature; same 404 as unknown key to avoid leaking tier
    if (!business || !business.widget_enabled || business.subscription_tier !== 'pro') {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    const canCreate = await canCreateConversation(business.id);
    if (!canCreate) {
      logger.warn('Chat widget: conversation limit reached', { businessId: business.id });
      return NextResponse.json(
        { error: 'This business is not accepting new chats right now.' },
        { status: 429 }
      );
    }

    const senderName = visitorName || 'Website Visitor';

    const { data: conversation, error: convoError } = await supabaseServer
      .from('conversations')
      .insert({
        business_id: business.id,
        customer_name: senderName,
        customer_email: visitorEmail,
        channel: 'chat',
        status: 'open',
        unread_count: 1,
        last_message_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (convoError || !conversation) {
      throw convoError || new Error('Failed to create conversation');
    }

    await incrementConversationUsage(business.id);

    const token = generateSessionToken();
    const { error: sessionError } = await supabaseServer.from('chat_sessions').insert({
      business_id: business.id,
      conversation_id: conversation.id,
      token_hash: hashSessionToken(token),
      visitor_name: visitorName,
      visitor_email: visitorEmail,
    });

    if (sessionError) {
      // Without a session the conversation is unreachable for the visitor
      await supabaseServer.from('conversations').delete().eq('id', conversation.id);
      throw sessionError;
    }

    const { data: savedMessage, error: messageError } = await supabaseServer
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        business_id: business.id,
        sender_type: 'customer',
        sender_name: senderName,
        content: validated.content,
        channel: 'chat',
        metadata: { source: 'chat_widget' },
      })
      .select('id, content, sender_type, sender_name, created_at')
      .single();

    if (messageError) throw messageError;

    logger.success('Chat widget session started', {
      businessId: business.id,
      conversationId: conversation.id,
    });

    const conversationId = conversation.id;
    after(async () => {
      await Promise.allSettled([
        generateAutoNotes(conversationId),
        sendAutoReply(conversationId),
        classifyNewMessage(conversationId, {
          messageContent: validated.content,
          subject: 'Website chat',
          messageId: savedMessage?.id,
        }),
      ]);
    });

    return NextResponse.json({ token, message: savedMessage });
  } catch (error: any) {
    logger.error('Chat widget session error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
