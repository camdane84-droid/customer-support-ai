import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseServer } from '@/lib/supabase-server';
import { canCreateConversation, incrementConversationUsage } from '@/lib/usage/tracker';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Resend sends inbound emails as JSON with type "email.received"
    if (body.type !== 'email.received') {
      return NextResponse.json({ status: 'ignored' });
    }

    const { data: eventData } = body;
    const { email_id, from, to, subject } = eventData;

    // Extract sender email and name from "Name <email>" format
    const fromMatch = from.match(/(.*?)\s*<(.+?)>/) || [null, from, from];
    const senderName = fromMatch[1]?.trim() || fromMatch[2];
    const senderEmail = fromMatch[2] || from;

    // "to" is an array in Resend
    const toAddress = Array.isArray(to) ? to[0] : to;

    logger.info('Email received via Resend', { from: senderEmail, to: toAddress, subject });

    // Fetch the email body from Resend (not included in webhook payload)
    let text = '';
    let html = '';
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const emailContent = await (resend as any).emails.receiving.get(email_id);
        text = emailContent?.data?.text || '';
        html = emailContent?.data?.html || '';
      } catch (fetchError: any) {
        logger.warn('Failed to fetch email body from Resend', { error: fetchError.message, email_id });
      }
    }

    // Get business by support email (the "to" address)
    let businessEmail = toAddress.match(/<(.+?)>/)?.[1] || toAddress;
    // Strip inbound subdomain if routed through a subdomain
    // e.g. hello@inbound.inbox-forge.com → hello@inbox-forge.com
    businessEmail = businessEmail.replace('@inbound.', '@');

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

    // Create message
    const content = text || html || subject;
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
        resend_email_id: email_id,
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
