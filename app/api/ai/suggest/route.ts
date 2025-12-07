import { NextRequest, NextResponse } from 'next/server';
import { generateResponseSuggestion } from '@/lib/ai/claude';
import { supabaseServer } from '@/lib/supabase-server';
import { rateLimitMiddleware } from '@/lib/middleware/rateLimit';

export async function POST(request: NextRequest) {
  // Rate limit: 20 requests per minute per IP
  const rateLimitResponse = rateLimitMiddleware(request, 20, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { conversationId, businessId } = await request.json();

    console.log('[AI Suggest] Request:', { conversationId, businessId });
    console.log('[AI Suggest] BusinessId type:', typeof businessId, 'length:', businessId?.length);

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

    console.log('[AI Suggest] All businesses:', allBusinesses);

    // Get business info
    const { data: business, error: businessError } = await supabaseServer
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    console.log('[AI Suggest] Query result:', { business, businessError });

    if (businessError) {
      console.error('[AI Suggest] Business query error:', businessError);
      return NextResponse.json(
        { error: `Database error: ${businessError.message}` },
        { status: 500 }
      );
    }

    if (!business) {
      console.error('[AI Suggest] Business not found. Looking for ID:', businessId);
      console.error('[AI Suggest] Available business IDs:', allBusinesses?.map(b => b.id));
      return NextResponse.json(
        { error: 'Business not found', debug: { businessId, availableIds: allBusinesses?.map(b => b.id) } },
        { status: 404 }
      );
    }

    console.log('[AI Suggest] Business found:', business.name);

    // Get conversation messages
    const { data: messages, error: messagesError } = await supabaseServer
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[AI Suggest] Messages query error:', messagesError);
      return NextResponse.json(
        { error: `Database error: ${messagesError.message}` },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      console.error('[AI Suggest] No messages found for conversation:', conversationId);
      return NextResponse.json(
        { error: 'No messages found' },
        { status: 404 }
      );
    }

    console.log('[AI Suggest] Messages found:', messages.length);

    // Get last customer message
    const lastCustomerMessage = messages
      .filter(m => m.sender_type === 'customer')
      .slice(-1)[0];

    if (!lastCustomerMessage) {
      console.error('[AI Suggest] No customer message found in conversation');
      return NextResponse.json(
        { error: 'No customer message to respond to' },
        { status: 400 }
      );
    }

    console.log('[AI Suggest] Last customer message:', lastCustomerMessage.content.substring(0, 50));

    // Get knowledge base
    const { data: knowledgeBase, error: kbError } = await supabaseServer
      .from('knowledge_base')
      .select('question, answer')
      .eq('business_id', businessId);

    if (kbError) {
      console.warn('[AI Suggest] Knowledge base query error (continuing anyway):', kbError);
    }

    console.log('[AI Suggest] Knowledge base entries:', knowledgeBase?.length || 0);

    // Build context
    const conversationHistory = messages.map(m => ({
      sender: (m.sender_type === 'customer' ? 'customer' : 'business') as 'customer' | 'business',
      message: m.content,
    }));

    const businessInfo = buildBusinessInfo(business);

    console.log('[AI Suggest] Calling Claude API...');

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

    console.log('[AI Suggest] Claude API response received');

    return NextResponse.json({ suggestion });
  } catch (error: any) {
    console.error('[AI Suggest] Error:', error);
    console.error('[AI Suggest] Error stack:', error.stack);
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
