import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { generateResponseSuggestion } from '@/lib/ai/claude';
import { shouldAutoReply } from '@/lib/auto-reply';
import { logger } from '@/lib/logger';
import {
  handleEmailSend,
  handleInstagramSend,
  handleWhatsAppSend,
  handleTikTokSend,
  checkIfSimulated,
} from '@/lib/channel-senders';

/**
 * POST /api/conversations/[id]/auto-reply
 * Automatically generate and send an AI reply to the latest customer message.
 * Called fire-and-forget from webhooks.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const conversationId = params.id;

    logger.debug('Auto-reply triggered', { conversationId });

    // Fetch conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Fetch business with all fields (auto-reply settings + business info)
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', conversation.business_id)
      .single();

    if (bizError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check if auto-reply should fire
    if (!shouldAutoReply(business)) {
      return NextResponse.json({
        success: false,
        message: 'Auto-reply not active for this business right now',
      });
    }

    // Skip for simulated conversations
    const isSimulated = await checkIfSimulated(conversationId, supabaseAdmin);
    if (isSimulated) {
      logger.debug('Skipping auto-reply for simulated conversation', { conversationId });
      return NextResponse.json({
        success: false,
        message: 'Simulated conversation — skipping auto-reply',
      });
    }

    // Fetch last 10 messages for context
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('content, sender_type, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (messagesError || !messages || messages.length === 0) {
      return NextResponse.json({ success: false, message: 'No messages to reply to' });
    }

    // Reverse to chronological order
    messages.reverse();

    // Get the last customer message
    const lastCustomerMessage = [...messages]
      .reverse()
      .find(m => m.sender_type === 'customer');

    if (!lastCustomerMessage) {
      return NextResponse.json({ success: false, message: 'No customer message to reply to' });
    }

    // Fetch knowledge base entries
    const { data: knowledgeBase } = await supabaseAdmin
      .from('knowledge_base')
      .select('question, answer')
      .eq('business_id', business.id);

    // Build conversation history for AI context
    const conversationHistory = messages.map(m => ({
      sender: (m.sender_type === 'customer' ? 'customer' : 'business') as 'customer' | 'business',
      message: m.content,
    }));

    // Build business info string
    let businessInfo = '';
    if (business.business_type) businessInfo += `Type: ${business.business_type}\n`;
    if (business.hours_of_operation) businessInfo += `Hours: ${JSON.stringify(business.hours_of_operation)}\n`;
    if (business.services && business.services.length > 0) businessInfo += `Services: ${business.services.join(', ')}\n`;
    if (business.policies) businessInfo += `Policies: ${business.policies}\n`;

    // Generate AI response using the existing suggestion function
    logger.debug('Generating auto-reply with AI', { conversationId });
    const aiReply = await generateResponseSuggestion(
      lastCustomerMessage.content,
      {
        businessName: business.name,
        businessInfo,
        conversationHistory,
        knowledgeBase: knowledgeBase || [],
      }
    );

    // Save AI message to database
    const { data: savedMessage, error: saveError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        business_id: business.id,
        sender_type: 'ai',
        sender_name: business.name,
        content: aiReply,
        channel: conversation.channel,
        status: 'sending',
        is_ai_suggested: false,
      })
      .select()
      .single();

    if (saveError || !savedMessage) {
      logger.error('Failed to save auto-reply message', saveError);
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }

    // Send via the appropriate channel
    try {
      if (conversation.channel === 'email') {
        await handleEmailSend(savedMessage, business.id, supabaseAdmin);
      } else if (conversation.channel === 'instagram') {
        await handleInstagramSend(savedMessage, business.id, supabaseAdmin);
      } else if (conversation.channel === 'whatsapp') {
        await handleWhatsAppSend(savedMessage, business.id, supabaseAdmin);
      } else if (conversation.channel === 'tiktok') {
        await handleTikTokSend(savedMessage, business.id, supabaseAdmin);
      }

      // Update status to sent
      await supabaseAdmin
        .from('messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', savedMessage.id);

      logger.success('Auto-reply sent', { conversationId, channel: conversation.channel });
    } catch (sendError: any) {
      // Update status to failed
      await supabaseAdmin
        .from('messages')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          error_message: sendError.message,
        })
        .eq('id', savedMessage.id);

      logger.error('Auto-reply delivery failed', sendError, { conversationId, channel: conversation.channel });
    }

    // Update conversation last_message_at
    await supabaseAdmin
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return NextResponse.json({
      success: true,
      messageId: savedMessage.id,
      message: 'Auto-reply sent',
    });

  } catch (error: any) {
    logger.error('Error in auto-reply', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
