import { supabaseAdmin } from '@/lib/api/supabase-admin';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

/**
 * Automatically generate notes from conversation messages.
 * Called directly from webhooks and the messages route (via after()) —
 * not exposed as an HTTP route.
 */
export async function generateAutoNotes(conversationId: string): Promise<void> {
  try {
    logger.debug('Auto-generating notes for conversation', { conversationId });

    if (!anthropic) {
      logger.warn('Anthropic API key not configured — skipping auto-notes');
      return;
    }

    // Fetch conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      logger.warn('Auto-notes: conversation not found', { conversationId });
      return;
    }

    // Check if auto-notes is enabled for this business
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('auto_generate_notes')
      .eq('id', conversation.business_id)
      .single();

    if (!business?.auto_generate_notes) return;

    // Fetch recent messages (last 10 to keep it relevant)
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('content, sender_type, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (messagesError || !messages || messages.length === 0) return;

    // Reverse to chronological order
    messages.reverse();

    // Format conversation for AI analysis
    const conversationText = messages.map(m =>
      `[${m.sender_type === 'customer' ? 'Customer' : 'Business'}]: ${m.content}`
    ).join('\n');

    // Use Claude to extract key points
    logger.debug('Calling Claude API to generate notes');
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Analyze this recent customer conversation and extract 2-4 concise bullet points that would be helpful for the business to remember about this customer.

Conversation:
${conversationText}

Focus on:
- Specific questions they asked (e.g., "asked about S coffee price")
- Product preferences or interests
- Issues or concerns they raised
- Important requests or follow-ups needed

Rules:
- Keep each bullet point SHORT (under 10 words)
- Be SPECIFIC with details (product names, quantities, issues)
- Use lowercase, no ending punctuation
- No generic statements
- Skip if nothing notable to add

Return ONLY the bullet points, one per line, starting with "- "
If there's nothing notable to add, return "SKIP"`
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const aiResponse = content.text.trim();

    // Skip if AI says there's nothing to add
    if (aiResponse === 'SKIP' || aiResponse.length === 0) {
      logger.debug('No notable information to add to notes');
      return;
    }

    // Get existing notes
    const existingNotes = conversation.notes || '';

    // Append new bullet points to existing notes
    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n${aiResponse}`
      : aiResponse;

    // Update conversation notes
    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({
        notes: updatedNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) {
      logger.error('Failed to update notes', updateError);
      return;
    }

    logger.success('Auto-notes generated and saved');
  } catch (error: any) {
    logger.error('Error generating auto-notes', error);
  }
}
