import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import Anthropic from '@anthropic-ai/sdk';

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

    console.log('👤 Extracting customer profile for conversation:', conversationId);

    // Check if Anthropic API key is configured
    if (!anthropic) {
      console.warn('⚠️ Anthropic API key not configured, returning empty profile');
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
    console.log('🤖 Calling Claude API to extract profile...');
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Analyze this customer support conversation and extract the following information in JSON format:

Conversation:
${conversationText}

Extract the following, keeping ALL responses CONCISE and bullet-point friendly:
1. past_orders: Array of products ordered (with date/quantity if mentioned)
2. issues: Array of problems/issues - be CONCISE, remove unnecessary words like "my", "the", "I have". Example: "order not received" NOT "my order was not received"
3. sizes_dimensions: Object with size/dimension info (e.g., {"shirt": "medium", "shoes": "10"})
4. preferences: Array of preferences - be CONCISE. Example: "email communication" NOT "prefers to be contacted by email"
5. allergies: Array of allergies/restrictions - CONCISE format. Example: "peanuts" NOT "allergic to peanuts"
6. best_times: Array of preferred contact times - CONCISE. Example: "mornings" NOT "best to contact in the mornings"
7. favorite_category: Most frequently ordered product category (if determinable)

IMPORTANT RULES:
- Keep ALL text concise and clean for bullet points
- Remove possessive pronouns (my, the, his, her)
- Remove unnecessary phrases (I have, I am, customer has)
- Use short, direct phrases
- No periods at the end of bullet points
- Lowercase unless proper noun

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

If information is not mentioned, use empty arrays/objects/null. Do not infer or make assumptions.`
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
      console.error('Failed to parse AI response:', parseError);
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
      console.error('Failed to save profile:', updateError);
    }

    console.log('✅ Customer profile extracted successfully');

    return NextResponse.json({
      profile,
      customer_name: conversation.customer_name,
      customer_email: conversation.customer_email,
      customer_instagram_id: conversation.customer_instagram_id,
      message: 'Profile extracted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error extracting customer profile:', error);
    console.error('Error details:', {
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
