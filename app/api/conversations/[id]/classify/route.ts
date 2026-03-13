import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * POST /api/conversations/[id]/classify
 * AI-classifies an inbound message as normal, important, or urgent.
 * Called fire-and-forget from the email webhook.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const conversationId = params.id;
    const body = await request.json();
    const { messageContent, subject, messageId } = body;

    if (!messageContent && !subject) {
      return NextResponse.json({ error: 'No content to classify' }, { status: 400 });
    }

    // Fetch conversation to get business_id
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('business_id, customer_name, customer_email')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Fetch business AI parse settings
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', conversation.business_id)
      .single();

    if (bizError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check if AI parsing is enabled
    if (!business.ai_parse_enabled) {
      return NextResponse.json({ success: false, message: 'AI parsing not enabled' });
    }

    // Check if at least one category is enabled
    if (!business.ai_parse_urgent && !business.ai_parse_important) {
      return NextResponse.json({ success: false, message: 'No categories enabled' });
    }

    // Build the classification prompt
    const urgentKeywords = (business.ai_parse_urgent_keywords || []).join(', ');
    const importantKeywords = (business.ai_parse_important_keywords || []).join(', ');

    const enabledCategories: string[] = [];
    if (business.ai_parse_urgent) enabledCategories.push('urgent');
    if (business.ai_parse_important) enabledCategories.push('important');

    const systemPrompt = `You are an email classifier for a business called "${business.name}".
Your job is to classify incoming customer emails into one of these priority levels:

${business.ai_parse_urgent ? `- "urgent": Emergencies, time-critical situations, safety issues, legal threats, things that need immediate attention even outside business hours. Something a business owner would want to be interrupted at home for.${urgentKeywords ? `\n  Business-specific urgent keywords: ${urgentKeywords}` : ''}` : ''}

${business.ai_parse_important ? `- "important": Positive business leads, bulk orders, partnership inquiries, high-value opportunities, significant customer complaints that could escalate. Things worth prioritizing but not emergencies.${importantKeywords ? `\n  Business-specific important keywords: ${importantKeywords}` : ''}` : ''}

- "normal": Regular customer inquiries, support questions, general messages.

Respond with ONLY valid JSON in this exact format:
{"priority": "normal" | "important" | "urgent", "reason": "brief 1-sentence explanation"}

Be conservative — most emails are "normal". Only flag as urgent or important when genuinely warranted.`;

    const emailContent = `Subject: ${subject || '(no subject)'}\n\nBody:\n${messageContent}`;

    logger.debug('Classifying email', { conversationId, subject });

    const aiResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: systemPrompt,
      messages: [{ role: 'user', content: emailContent }],
    });

    // Parse AI response — handle markdown-wrapped JSON
    const responseText = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '';
    logger.debug('AI classification raw response', { responseText });
    let classification: { priority: string; reason: string };

    try {
      // Try direct JSON parse first
      classification = JSON.parse(responseText);
    } catch {
      // Strip markdown code fences if present
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                        responseText.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        try {
          classification = JSON.parse(jsonMatch[1].trim());
        } catch {
          logger.warn('Failed to parse AI classification response', { responseText });
          classification = { priority: 'normal', reason: 'Classification parse error' };
        }
      } else {
        logger.warn('No JSON found in AI classification response', { responseText });
        classification = { priority: 'normal', reason: 'Classification parse error' };
      }
    }

    // Validate priority value
    const validPriorities = ['normal', ...enabledCategories];
    if (!validPriorities.includes(classification.priority)) {
      classification.priority = 'normal';
    }

    // Update message with priority
    if (messageId) {
      await supabaseAdmin
        .from('messages')
        .update({
          priority: classification.priority,
          priority_reason: classification.reason,
        })
        .eq('id', messageId);
    } else {
      // Find the most recent customer message in this conversation
      const { data: latestMessage } = await supabaseAdmin
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'customer')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestMessage) {
        await supabaseAdmin
          .from('messages')
          .update({
            priority: classification.priority,
            priority_reason: classification.reason,
          })
          .eq('id', latestMessage.id);
      }
    }

    // If flagged, create in-app notification
    if (classification.priority !== 'normal') {
      const notificationTitle = classification.priority === 'urgent'
        ? `Urgent: ${subject || 'New message'}`
        : `Important: ${subject || 'New message'}`;

      const notificationSummary = `From ${conversation.customer_name || conversation.customer_email || 'Unknown'}: ${classification.reason}`;

      await supabaseAdmin
        .from('notifications')
        .insert({
          business_id: conversation.business_id,
          message_id: messageId || null,
          conversation_id: conversationId,
          type: classification.priority,
          title: notificationTitle,
          summary: notificationSummary,
        });

      logger.info(`Email classified as ${classification.priority}`, {
        conversationId,
        reason: classification.reason,
      });

      // Send external notification email if personal email is configured and category is enabled
      const shouldNotify =
        (classification.priority === 'urgent' && (business.ai_parse_notify_urgent ?? true)) ||
        (classification.priority === 'important' && (business.ai_parse_notify_important ?? true));

      if (business.ai_parse_notify_email && shouldNotify) {
        try {
          await sendNotificationEmail({
            to: business.ai_parse_notify_email,
            businessName: business.name,
            priority: classification.priority,
            subject: subject || 'New message',
            senderName: conversation.customer_name || conversation.customer_email || 'Unknown',
            reason: classification.reason,
            conversationId,
          });
          logger.info('Notification email sent', { to: business.ai_parse_notify_email });
        } catch (emailError: any) {
          logger.error('Failed to send notification email', emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      priority: classification.priority,
      reason: classification.reason,
    });

  } catch (error: any) {
    logger.error('Error in email classification', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Send a notification email to the business owner's personal email
 */
async function sendNotificationEmail(params: {
  to: string;
  businessName: string;
  priority: string;
  subject: string;
  senderName: string;
  reason: string;
  conversationId: string;
}) {
  const sgMail = await import('@sendgrid/mail');
  sgMail.default.setApiKey(process.env.SENDGRID_API_KEY!);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.inboxforge.com';
  const priorityLabel = params.priority === 'urgent' ? 'URGENT' : 'IMPORTANT';
  const priorityColor = params.priority === 'urgent' ? '#dc2626' : '#6366f1';

  await sgMail.default.send({
    to: params.to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: `[${priorityLabel}] ${params.subject} — ${params.businessName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: ${priorityColor}; color: white; padding: 12px 20px; border-radius: 8px 8px 0 0; font-size: 14px; font-weight: 600;">
          ${priorityLabel} — ${params.businessName}
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 8px; color: #111827; font-size: 16px; font-weight: 600;">
            ${params.subject}
          </p>
          <p style="margin: 0 0 4px; color: #6b7280; font-size: 14px;">
            From: ${params.senderName}
          </p>
          <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">
            AI Reason: ${params.reason}
          </p>
          <a href="${appUrl}/dashboard/inbox?conversation=${params.conversationId}"
             style="display: inline-block; background: ${priorityColor}; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
            View in InboxForge
          </a>
        </div>
        <p style="margin: 12px 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
          Sent by InboxForge AI Email Parsing
        </p>
      </div>
    `,
  });
}
