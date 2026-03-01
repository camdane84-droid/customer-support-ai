import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { canCreateConversation, incrementConversationUsage } from '@/lib/usage/tracker';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // SendGrid Inbound Parse sends email data as form fields
    const from = formData.get('from') as string;
    const to = formData.get('to') as string;
    const subject = formData.get('subject') as string;
    const text = formData.get('text') as string;
    const html = formData.get('html') as string;

    // Extract sender email and name
    const fromMatch = from.match(/(.*?)\s*<(.+?)>/) || [null, from, from];
    const senderName = fromMatch[1]?.trim() || fromMatch[2];
    const senderEmail = fromMatch[2] || from;

    logger.info('Email received', { from: senderEmail, to, subject });

    // Get business by support email (the "to" address)
    let businessEmail = to.match(/<(.+?)>/)?.[1] || to;
    // Strip subdomains if present (legacy support)
    businessEmail = businessEmail.replace('@mail.', '@').replace('@parse.', '@');

    const { data: business } = await supabaseServer
      .from('businesses')
      .select('*')
      .eq('email', businessEmail)
      .single();

    if (!business) {
      logger.error('No business found for email', undefined, { businessEmail });
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Find or create conversation
    let conversationId;
    const { data: existingConv } = await supabaseServer
      .from('conversations')
      .select('id')
      .eq('business_id', business.id)
      .eq('customer_email', senderEmail)
      .eq('channel', 'email')
      .single();

    if (existingConv) {
      conversationId = existingConv.id;

      // Get current unread count
      const { data: currentConvo } = await supabaseServer
        .from('conversations')
        .select('unread_count')
        .eq('id', conversationId)
        .single();

      const currentUnreadCount = currentConvo?.unread_count || 0;

      // Update existing conversation with new message timestamp and increment unread count
      await supabaseServer
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_count: currentUnreadCount + 1,
          status: 'open',
        })
        .eq('id', conversationId);

      logger.debug('Updated existing conversation', { conversationId, unreadCount: currentUnreadCount + 1 });
    } else {
      logger.debug('Creating new conversation', { senderEmail });

      // Check conversation usage limit before creating
      const canCreate = await canCreateConversation(business.id);
      if (!canCreate) {
        logger.warn('Conversation limit reached for business', { businessId: business.id });
        return NextResponse.json(
          {
            error: 'Conversation limit reached',
            message: 'Your monthly conversation limit has been reached. Please upgrade your plan to continue receiving new conversations.'
          },
          { status: 429 }
        );
      }

      const { data: newConvo, error: convoError } = await supabaseServer
        .from('conversations')
        .insert({
          business_id: business.id,
          customer_name: senderName,
          customer_email: senderEmail,
          channel: 'email',
          status: 'open',
          unread_count: 1,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (convoError) throw convoError;
      conversationId = newConvo?.id;

      // Increment conversation usage counter
      const incrementSuccess = await incrementConversationUsage(business.id);
      if (!incrementSuccess) {
        logger.warn('Failed to increment conversation usage counter');
      } else {
        logger.debug('Conversation usage incremented');
      }
    }

    if (!conversationId) {
      logger.error('Failed to create/find conversation');
      throw new Error('Failed to create/find conversation');
    }

    // Create message - strip quoted thread from replies so only the new content is saved
    const rawContent = text || html || subject;
    const content = extractLatestReply(rawContent);
    await supabaseServer.from('messages').insert({
      conversation_id: conversationId,
      business_id: business.id,
      sender_type: 'customer',
      sender_name: senderName,
      content: content,
      channel: 'email',
      metadata: {
        subject: subject,
        from_email: senderEmail,
      },
    });

    logger.success('Email message saved');
    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    logger.error('Email webhook error', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  return new NextResponse('Email webhook is ready', { status: 200 });
}

/**
 * Strips quoted reply content from an email, returning only the new message.
 * Handles common patterns from Gmail, Outlook, Apple Mail, Yahoo, etc.
 */
function extractLatestReply(body: string): string {
  if (!body) return body;

  // First try: regex on the full body for multi-line "On ... wrote:" (Gmail wraps this across lines)
  const gmailPattern = /\r?\nOn .+wrote:\s*\r?\n/is;
  const gmailMatch = body.search(gmailPattern);
  if (gmailMatch > 0) {
    const newContent = body.slice(0, gmailMatch).trim();
    if (newContent.length > 0) return newContent;
  }

  // Second try: line-by-line checks for other patterns
  const lines = body.split('\n');
  const cutIndex = lines.findIndex((line) => {
    const trimmed = line.trim();

    // "-----Original Message-----" (Outlook)
    if (/^-{2,}\s*Original Message\s*-{2,}$/i.test(trimmed)) return true;

    // "________" divider (some clients)
    if (/^_{5,}$/.test(trimmed)) return true;

    // "Sent from my iPhone/iPad" etc.
    if (/^Sent from my /i.test(trimmed)) return true;

    // Line starting with ">" (quoted text) — only if preceded by a blank line
    if (/^>/.test(trimmed)) return true;

    return false;
  });

  if (cutIndex > 0) {
    const newContent = lines.slice(0, cutIndex).join('\n').trim();
    if (newContent.length > 0) return newContent;
  }

  // Fallback: return original trimmed
  return body.trim();
}
