import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { canCreateConversation, incrementConversationUsage } from '@/lib/usage/tracker';
import { generateAutoNotes } from '@/lib/ai/auto-notes';
import { sendAutoReply } from '@/lib/ai/send-auto-reply';
import { classifyNewMessage } from '@/lib/ai/classify';
import {
  parseEnvelopeRecipients,
  findParseRecipient,
  isGmailForwardingConfirmation,
  parseGmailForwardingConfirmation,
} from '@/lib/forwarding';
import { getAutoReplySuppressionReason } from '@/lib/email-loop-guard';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // SendGrid doesn't sign Inbound Parse requests, so the webhook URL carries
    // a shared secret (?token=...) that must match EMAIL_WEBHOOK_TOKEN.
    if (process.env.EMAIL_WEBHOOK_TOKEN) {
      const token = request.nextUrl.searchParams.get('token');
      if (token !== process.env.EMAIL_WEBHOOK_TOKEN) {
        logger.warn('Email webhook: invalid or missing token');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      logger.warn('EMAIL_WEBHOOK_TOKEN is not set — inbound email webhook is unauthenticated. Set it and add ?token=... to the SendGrid Inbound Parse URL.');
    }

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

    // Drop mail we sent ourselves if it gets forwarded back to us (verification
    // codes, alert emails, auto-replies) — prevents forwarding loops. Bounces too.
    const ownSenders = [process.env.RESEND_FROM_EMAIL, process.env.SENDGRID_FROM_EMAIL]
      .filter((a): a is string => !!a)
      .map(a => a.toLowerCase());
    const senderLower = senderEmail.trim().toLowerCase();
    if (ownSenders.includes(senderLower) || senderLower.startsWith('mailer-daemon@')) {
      logger.info('Ignoring self-originated or bounce email', { senderEmail });
      return NextResponse.json({ status: 'ignored' });
    }

    // Get business by support email (the "to" address)
    let businessEmail = to.match(/<(.+?)>/)?.[1] || to;
    // Strip subdomains if present (legacy support)
    businessEmail = businessEmail.replace('@mail.', '@').replace('@parse.', '@');

    let business: any = null;
    let socialConnectionId: string | null = null;
    let channelAddress: string | null = null;

    // Forwarded mail: the SMTP envelope recipient is the connection's unique
    // parse address, while the To: header still shows the business's real
    // address. Route on the envelope first — it's deterministic.
    const envelopeRecipients = parseEnvelopeRecipients(formData.get('envelope') as string | null);
    const parseRecipient = findParseRecipient(envelopeRecipients);

    if (parseRecipient) {
      const { data: fwdConnection } = await supabaseServer
        .from('social_connections')
        .select('id, business_id, platform_user_id, verified, metadata, forwarding_confirmed_at')
        .eq('platform', 'email')
        .eq('forwarding_address', parseRecipient)
        .eq('is_active', true)
        .single();

      if (fwdConnection) {
        // Gmail sends a confirmation email to the forwarding destination when
        // the user adds it. Store the code/link so the settings UI can show it,
        // and don't create a conversation for it.
        if (isGmailForwardingConfirmation(senderEmail, subject || '')) {
          const confirmation = parseGmailForwardingConfirmation(subject || '', text || html || '');

          await supabaseServer
            .from('social_connections')
            .update({
              metadata: { ...(fwdConnection.metadata || {}), gmail_confirmation: confirmation },
            })
            .eq('id', fwdConnection.id);

          // The confirmation names the mailbox that requested forwarding. Only
          // someone with access to that mailbox could have initiated it — if it
          // matches the connected address, that proves ownership.
          if (!fwdConnection.verified && confirmation.sourceEmail === fwdConnection.platform_user_id) {
            const { error: verifyError } = await supabaseServer
              .from('social_connections')
              .update({
                verified: true,
                verification_code: null,
                verification_expires_at: null,
              })
              .eq('id', fwdConnection.id);

            if (verifyError) {
              // Unique index: another workspace already verified this address
              logger.warn('Could not auto-verify connection from Gmail confirmation', {
                connectionId: fwdConnection.id,
                error: verifyError.message,
              });
            } else {
              logger.success('Connection auto-verified via Gmail forwarding confirmation', {
                connectionId: fwdConnection.id,
              });
            }
          }

          logger.info('Stored Gmail forwarding confirmation', { connectionId: fwdConnection.id });
          return NextResponse.json({ status: 'ok' });
        }

        if (!fwdConnection.verified) {
          logger.warn('Forwarded mail for unverified connection dropped', {
            connectionId: fwdConnection.id,
          });
          return NextResponse.json({ error: 'Connection not verified' }, { status: 403 });
        }

        socialConnectionId = fwdConnection.id;
        channelAddress = fwdConnection.platform_user_id;

        const { data: biz } = await supabaseServer
          .from('businesses')
          .select('*')
          .eq('id', fwdConnection.business_id)
          .single();
        business = biz;

        // First forwarded message proves the forwarding rule works
        if (business && !fwdConnection.forwarding_confirmed_at) {
          await supabaseServer
            .from('social_connections')
            .update({ forwarding_confirmed_at: new Date().toISOString() })
            .eq('id', fwdConnection.id);
        }
      }
    }

    // Direct mail: look up via social_connections by the To: header
    if (!business) {
      const { data: emailConnection } = await supabaseServer
        .from('social_connections')
        .select('id, business_id, platform_user_id')
        .eq('platform', 'email')
        .eq('platform_user_id', businessEmail)
        .eq('is_active', true)
        .eq('verified', true)
        .single();

      if (emailConnection) {
        socialConnectionId = emailConnection.id;
        channelAddress = emailConnection.platform_user_id;

        const { data: biz } = await supabaseServer
          .from('businesses')
          .select('*')
          .eq('id', emailConnection.business_id)
          .single();

        business = biz;
      }
    }

    // Fallback: look up via businesses.email (backward compat)
    if (!business) {
      const { data: biz } = await supabaseServer
        .from('businesses')
        .select('*')
        .eq('email', businessEmail)
        .single();

      business = biz;
      channelAddress = businessEmail;
    }

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
          ...(socialConnectionId && { social_connection_id: socialConnectionId }),
          ...(channelAddress && { channel_address: channelAddress }),
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

    // Machine-generated mail (newsletters, out-of-office, notifications,
    // no-reply senders) still gets ingested and classified, but must never
    // receive an AI reply — that's how mail loops start.
    const rawHeaders = formData.get('headers') as string | null;
    const suppressReason = getAutoReplySuppressionReason(rawHeaders, senderEmail);

    // Create message - strip quoted thread from replies so only the new content is saved
    const rawContent = text || html || subject;
    const content = extractLatestReply(rawContent);
    const { data: savedMessage } = await supabaseServer.from('messages').insert({
      conversation_id: conversationId,
      business_id: business.id,
      sender_type: 'customer',
      sender_name: senderName,
      content: content,
      channel: 'email',
      metadata: {
        subject: subject,
        from_email: senderEmail,
        to_email: channelAddress || businessEmail,
        ...(suppressReason && { automated_sender: suppressReason }),
      },
    }).select('id').single();

    logger.success('Email message saved');

    // Run AI processing after the response is sent. after() keeps the serverless
    // function alive, unlike fire-and-forget fetch which can be killed mid-flight.
    const savedConversationId = conversationId;
    if (suppressReason) {
      logger.info('Auto-reply suppressed for automated sender', { senderEmail, reason: suppressReason });
    }
    after(async () => {
      await Promise.allSettled([
        generateAutoNotes(savedConversationId),
        ...(suppressReason ? [] : [sendAutoReply(savedConversationId)]),
        classifyNewMessage(savedConversationId, {
          messageContent: content,
          subject,
          messageId: savedMessage?.id,
        }),
      ]);
    });

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
  const gmailPattern = /\r?\nOn [\s\S]+?wrote:\s*\r?\n/i;
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
