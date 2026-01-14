import { NextRequest, NextResponse } from 'next/server';
import { generateResponseSuggestion } from '@/lib/ai/claude';
import { supabaseServer } from '@/lib/supabase-server';
import { rateLimitMiddleware } from '@/lib/middleware/rateLimit';
import { canUseAiSuggestion, incrementAiUsage, getUsageStatus } from '@/lib/usage/tracker';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  // Rate limit: 20 requests per minute per IP
  const rateLimitResponse = rateLimitMiddleware(request, 20, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { conversationId, businessId } = await request.json();

    logger.debug('[AI Suggest] Request', { conversationId, businessId });
    logger.debug('[AI Suggest] BusinessId type', { type: typeof businessId, length: businessId?.length });

    if (!conversationId || !businessId) {
      return NextResponse.json(
        { error: 'Missing conversationId or businessId' },
        { status: 400 }
      );
    }

    // First check what businesses exist
    const { data: allBusinesses } = await supabaseServer
      .from('businesses')
      .select('id, name, email');

    logger.debug('[AI Suggest] All businesses', { allBusinesses });

    // Get business info
    const { data: business, error: businessError } = await supabaseServer
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    logger.debug('[AI Suggest] Query result', { business, businessError });

    if (businessError) {
      logger.error('[AI Suggest] Business query error', businessError);
      return NextResponse.json(
        { error: `Database error: ${businessError.message}` },
        { status: 500 }
      );
    }

    if (!business) {
      logger.error('[AI Suggest] Business not found', undefined, { businessId, availableIds: allBusinesses?.map(b => b.id) });
      return NextResponse.json(
        { error: 'Business not found', debug: { businessId, availableIds: allBusinesses?.map(b => b.id) } },
        { status: 404 }
      );
    }

    logger.debug('[AI Suggest] Business found', { businessName: business.name, autoGenerateNotes: business.auto_generate_notes });

    // Check if AI insights are enabled
    if (!business.auto_generate_notes) {
      logger.debug('[AI Suggest] AI insights disabled for business', { businessId });
      return NextResponse.json(
        {
          error: 'AI Customer Insights is disabled. Enable it in Settings to use AI features.',
          insightsDisabled: true,
        },
        { status: 403 }
      );
    }

    // Check usage limits
    const canUse = await canUseAiSuggestion(businessId);
    if (!canUse) {
      logger.debug('[AI Suggest] Usage limit reached for business', { businessId });
      const usageStatus = await getUsageStatus(businessId);

      return NextResponse.json(
        {
          error: 'AI suggestion limit reached',
          limitReached: true,
          usageStatus: {
            aiSuggestionsUsed: usageStatus?.aiSuggestionsUsed,
            aiSuggestionsLimit: usageStatus?.aiSuggestionsLimit,
            resetAt: usageStatus?.resetAiAt,
            tier: usageStatus?.tier,
          },
          message: `You've reached your daily limit of ${usageStatus?.aiSuggestionsLimit} AI suggestions. Upgrade to get more, or wait until ${usageStatus?.resetAiAt?.toLocaleString()} for your limit to reset.`,
        },
        { status: 429 } // 429 Too Many Requests
      );
    }

    logger.debug('[AI Suggest] Usage check passed');

    // Get conversation messages
    const { data: messages, error: messagesError } = await supabaseServer
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      logger.error('[AI Suggest] Messages query error', messagesError);
      return NextResponse.json(
        { error: `Database error: ${messagesError.message}` },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      logger.error('[AI Suggest] No messages found for conversation', undefined, { conversationId });
      return NextResponse.json(
        { error: 'No messages found' },
        { status: 404 }
      );
    }

    logger.debug('[AI Suggest] Messages found', { count: messages.length });

    // Get last customer message
    const lastCustomerMessage = messages
      .filter(m => m.sender_type === 'customer')
      .slice(-1)[0];

    if (!lastCustomerMessage) {
      logger.error('[AI Suggest] No customer message found in conversation');
      return NextResponse.json(
        { error: 'No customer message to respond to' },
        { status: 400 }
      );
    }

    logger.debug('[AI Suggest] Last customer message', { preview: lastCustomerMessage.content.substring(0, 50) });

    // Get knowledge base
    const { data: knowledgeBase, error: kbError } = await supabaseServer
      .from('knowledge_base')
      .select('question, answer')
      .eq('business_id', businessId);

    if (kbError) {
      logger.warn('[AI Suggest] Knowledge base query error (continuing anyway)', { error: kbError });
    }

    logger.debug('[AI Suggest] Knowledge base entries', { count: knowledgeBase?.length || 0 });

    // Build context
    const conversationHistory = messages.map(m => ({
      sender: (m.sender_type === 'customer' ? 'customer' : 'business') as 'customer' | 'business',
      message: m.content,
    }));

    const businessInfo = buildBusinessInfo(business);

    logger.debug('[AI Suggest] Calling Claude API...');

    // Generate suggestion
    const suggestion = await generateResponseSuggestion(
      lastCustomerMessage.content,
      {
        businessName: business.name,
        businessInfo,
        conversationHistory,
        knowledgeBase: knowledgeBase || [],
      }
    );

    logger.debug('[AI Suggest] Claude API response received');

    // Increment AI usage counter
    const incrementSuccess = await incrementAiUsage(businessId);
    if (!incrementSuccess) {
      logger.warn('[AI Suggest] Failed to increment usage counter');
    } else {
      logger.debug('[AI Suggest] Usage counter incremented');
    }

    return NextResponse.json({ suggestion });
  } catch (error: any) {
    logger.error('[AI Suggest] Error', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestion' },
      { status: 500 }
    );
  }
}

function buildBusinessInfo(business: any): string {
  let info = '';

  if (business.business_type) {
    info += `Type: ${business.business_type}\n`;
  }

  if (business.hours_of_operation) {
    info += `Hours: ${JSON.stringify(business.hours_of_operation)}\n`;
  }

  if (business.services && business.services.length > 0) {
    info += `Services: ${business.services.join(', ')}\n`;
  }

  if (business.policies) {
    info += `Policies: ${business.policies}\n`;
  }

  return info;
}
