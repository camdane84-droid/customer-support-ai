import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIContext {
  businessName: string;
  businessInfo?: string;
  conversationHistory: Array<{
    sender: 'customer' | 'business';
    message: string;
  }>;
  knowledgeBase?: Array<{
    question: string;
    answer: string;
  }>;
}

export async function generateResponseSuggestion(
  customerMessage: string,
  context: AIContext
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context);

  console.log('[Claude] Generating response for:', customerMessage.substring(0, 50));
  console.log('[Claude] API Key present:', !!process.env.ANTHROPIC_API_KEY);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: customerMessage,
        },
      ],
    });

    console.log('[Claude] Response received, content blocks:', message.content.length);

    // Extract text from response
    const textContent = message.content.find(block => block.type === 'text');
    return textContent && 'text' in textContent ? textContent.text : 'I can help you with that. Let me get back to you shortly.';
  } catch (error: any) {
    console.error('[Claude] API error:', error);
    console.error('[Claude] Error message:', error.message);
    console.error('[Claude] Error status:', error.status);
    console.error('[Claude] Error type:', error.type);
    throw new Error(`Failed to generate AI suggestion: ${error.message}`);
  }
}

function buildSystemPrompt(context: AIContext): string {
  let prompt = `You are a helpful customer support assistant for ${context.businessName}.

Your role is to suggest friendly, professional responses to customer inquiries.

Guidelines:
- Be warm, helpful, and concise
- Match the tone of the business (professional but friendly)
- If you don't have enough information to answer, ask clarifying questions
- Keep responses under 100 words unless more detail is needed
- Use the business's knowledge base when available`;

  // Add business info if available
  if (context.businessInfo) {
    prompt += `\n\nBusiness Information:\n${context.businessInfo}`;
  }

  // Add knowledge base if available
  if (context.knowledgeBase && context.knowledgeBase.length > 0) {
    prompt += `\n\nKnowledge Base (use this to answer common questions):`;
    context.knowledgeBase.forEach(item => {
      prompt += `\n\nQ: ${item.question}\nA: ${item.answer}`;
    });
  }

  // Add conversation history for context
  if (context.conversationHistory.length > 0) {
    prompt += `\n\nRecent conversation history:`;
    context.conversationHistory.slice(-5).forEach(msg => {
      const sender = msg.sender === 'customer' ? 'Customer' : 'You';
      prompt += `\n${sender}: ${msg.message}`;
    });
  }

  return prompt;
}
