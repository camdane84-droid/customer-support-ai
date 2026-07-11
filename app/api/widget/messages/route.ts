import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { generateAutoNotes } from '@/lib/ai/auto-notes';
import { sendAutoReply } from '@/lib/ai/send-auto-reply';
import { classifyNewMessage } from '@/lib/ai/classify';
import { getSessionByToken, validateMessageContent } from '@/lib/chat-widget';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * Widget message polling. Authenticated by the visitor's session token;
 * returns only the fields the chat bubble needs.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  // Widget polls every 3s (~20/min); allow a few tabs' worth of headroom
  if (!rateLimit(`widget-poll:${token || getClientIp(request)}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const session = await getSessionByToken(supabaseServer, token);
  if (!session) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  let query = supabaseServer
    .from('messages')
    .select('id, content, sender_type, sender_name, created_at')
    .eq('conversation_id', session.conversation_id)
    .neq('status', 'failed')
    .order('created_at', { ascending: true })
    .limit(100);

  const since = request.nextUrl.searchParams.get('since');
  if (since && !Number.isNaN(Date.parse(since))) {
    query = query.gt('created_at', since);
  }

  const { data: messages, error } = await query;
  if (error) {
    logger.error('Chat widget: failed to fetch messages', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  // Fire-and-forget presence bump; not worth failing the poll over
  after(async () => {
    await supabaseServer
      .from('chat_sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', session.id);
  });

  return NextResponse.json({ messages: messages || [] });
}

/**
 * Visitor sends a message into an existing session.
 */
export async function POST(request: NextRequest) {
  try {
    // Every message triggers AI processing — cap per session and per client
    const ip = getClientIp(request);
    if (!rateLimit(`widget-send-ip:${ip}`, 30, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (typeof body.token === 'string' && !rateLimit(`widget-send:${body.token}`, 15, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const session = await getSessionByToken(supabaseServer, body.token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const validated = validateMessageContent(body.message);
    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { data: savedMessage, error: messageError } = await supabaseServer
      .from('messages')
      .insert({
        conversation_id: session.conversation_id,
        business_id: session.business_id,
        sender_type: 'customer',
        sender_name: session.visitor_name || 'Website Visitor',
        content: validated.content,
        channel: 'chat',
        metadata: { source: 'chat_widget' },
      })
      .select('id, content, sender_type, sender_name, created_at')
      .single();

    if (messageError) throw messageError;

    // Bump conversation like the inbound webhooks do
    const { data: conversation } = await supabaseServer
      .from('conversations')
      .select('unread_count')
      .eq('id', session.conversation_id)
      .single();

    await supabaseServer
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        unread_count: (conversation?.unread_count || 0) + 1,
        status: 'open',
      })
      .eq('id', session.conversation_id);

    const conversationId = session.conversation_id;
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

    return NextResponse.json({ message: savedMessage });
  } catch (error: any) {
    logger.error('Chat widget message error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
