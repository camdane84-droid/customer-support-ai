import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

interface CustomerProfile {
  past_orders: Array<{
    product: string;
    date?: string;
    quantity?: number;
  }>;
  issues: string[];
  sizes_dimensions: Record<string, string>;
  preferences: string[];
  allergies: string[];
  best_times: string[];
  favorite_category?: string;
  needs_more_data: string[];
}

// POST /api/customers/[id]/profile - Extract customer profile from conversation history
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const conversationId = params.id;

    logger.debug('Extracting customer profile for conversation', { conversationId });

    // Check if Anthropic API key is configured
    if (!anthropic) {
      logger.warn('Anthropic API key not configured, returning empty profile');
      return NextResponse.json({
        profile: {
          past_orders: [],
          issues: [],
          sizes_dimensions: {},
          preferences: [],
          allergies: [],
          best_times: [],
          needs_more_data: ['past_orders', 'issues', 'sizes_dimensions', 'preferences', 'allergies', 'best_times', 'favorite_category']
        },
        message: 'AI extraction not available - API key not configured'
      });
    }

    // Fetch conversation details
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if AI insights is enabled for this business
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('auto_generate_notes')
      .eq('id', conversation.business_id)
      .single();

    if (!business?.auto_generate_notes) {
      logger.warn('AI Customer Insights not enabled for this business');
      return NextResponse.json({
        profile: {
          past_orders: [],
          issues: [],
          sizes_dimensions: {},
          preferences: [],
          allergies: [],
          best_times: [],
          needs_more_data: ['past_orders', 'issues', 'sizes_dimensions', 'preferences', 'allergies', 'best_times', 'favorite_category']
        },
        message: 'AI Customer Insights is disabled. Enable it in Settings to use this feature.'
      });
    }

    // Fetch all messages for this conversation
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('content, sender_type, sender_name, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        profile: {
          past_orders: [],
          issues: [],
          sizes_dimensions: {},
          preferences: [],
          allergies: [],
          best_times: [],
          needs_more_data: ['past_orders', 'issues', 'sizes_dimensions', 'preferences', 'allergies', 'best_times', 'favorite_category']
        },
        message: 'No conversation history to analyze'
      });
    }

    // Format conversation for AI analysis
    const conversationText = messages.map(m =>
      `[${m.sender_type === 'customer' ? 'Customer' : 'Support'}]: ${m.content}`
    ).join('\n');

    // Use Claude to extract structured data
    logger.debug('Calling Claude API to extract profile');
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Analyze this customer support conversation and extract ONLY essential, actionable customer information in JSON format:

Conversation:
${conversationText}

Extract ONLY the following information if explicitly mentioned:

1. past_orders: Products the customer has purchased (with date/quantity if mentioned)
   - Include ONLY if specific products are mentioned

2. issues: Actual problems the customer experienced (e.g., "damaged item", "late delivery")
   - Include ONLY real issues/complaints, NOT general inquiries
   - Be CONCISE: "order not received" NOT "my order was not received"

3. sizes_dimensions: The customer's PERSONAL sizes (e.g., {"shirt": "medium", "ring": "7"})
   - Include ONLY if customer states their personal size/fit
   - DO NOT include product order sizes (e.g., "small coffee", "large pizza")
   - DO NOT include if just ordering a size once
   - Only include if it's a reusable fact about the customer

4. preferences: Customer-specific preferences that affect future service
   - Include ONLY actionable preferences like "no ice", "decaf only", "leave at door"
   - DO NOT include: order methods (online ordering), payment types, or one-time requests
   - Must be something that would apply to future interactions

5. allergies: Food allergies or dietary restrictions
   - Include ONLY if explicitly stated

6. best_times: Preferred contact/delivery times
   - Include ONLY if customer explicitly states time preferences

7. favorite_category: Most frequently ordered product type (if 3+ orders of same type)
   - Include ONLY if clear pattern emerges

CRITICAL RULES:
- Be VERY selective - only include information that is:
  * Explicitly stated by the customer
  * Reusable for future interactions
  * Actionable for the support team
- Keep all text concise (remove "my", "the", "I have", etc.)
- Format professionally: Capitalize first letter, use proper punctuation
- End each item with a period for professional documentation
- Use proper capitalization for names, places, and proper nouns
- When in doubt, LEAVE IT OUT

FORMATTING EXAMPLES:
- allergies: ["Peanuts.", "Dairy.", "Shellfish."]
- preferences: ["No ice in drinks.", "Extra napkins.", "Leave at door."]
- issues: ["Order not received.", "Damaged item.", "Wrong size delivered."]

Return ONLY valid JSON in this exact format:
{
  "past_orders": [{"product": "string", "date": "string", "quantity": number}],
  "issues": ["string"],
  "sizes_dimensions": {"item": "size"},
  "preferences": ["string"],
  "allergies": ["string"],
  "best_times": ["string"],
  "favorite_category": "string or null"
}

If information is not explicitly mentioned or doesn't meet the criteria above, use empty arrays/objects/null.`
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse AI response
    let profile: CustomerProfile;
    try {
      // Extract JSON from response (it might have markdown code blocks)
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      profile = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      logger.error('Failed to parse AI response', parseError);
      throw new Error('Failed to parse profile data');
    }

    // Determine which fields need more data
    const needs_more_data: string[] = [];
    if (profile.past_orders.length === 0) needs_more_data.push('past_orders');
    if (profile.issues.length === 0) needs_more_data.push('issues');
    if (Object.keys(profile.sizes_dimensions).length === 0) needs_more_data.push('sizes_dimensions');
    if (profile.preferences.length === 0) needs_more_data.push('preferences');
    if (profile.allergies.length === 0) needs_more_data.push('allergies');
    if (profile.best_times.length === 0) needs_more_data.push('best_times');
    if (!profile.favorite_category) needs_more_data.push('favorite_category');

    profile.needs_more_data = needs_more_data;

    // Save profile to conversation metadata
    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({
        customer_profile: profile,
        profile_updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) {
      logger.error('Failed to save profile', updateError);
    }

    logger.success('Customer profile extracted successfully');

    return NextResponse.json({
      profile,
      customer_name: conversation.customer_name,
      customer_email: conversation.customer_email,
      customer_instagram_id: conversation.customer_instagram_id,
      message: 'Profile extracted successfully'
    });

  } catch (error: any) {
    logger.error('Error extracting customer profile', error, {
      message: error.message,
      status: error.status,
      type: error.type,
      stack: error.stack
    });
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: error.error?.message || error.status || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
