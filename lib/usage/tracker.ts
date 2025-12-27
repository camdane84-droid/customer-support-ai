import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define tier limits
export const TIER_LIMITS = {
  free: {
    ai_suggestions_per_day: 20,
    conversations_per_month: 50,
  },
  starter: {
    ai_suggestions_per_day: 500,
    conversations_per_month: 500,
  },
  pro: {
    ai_suggestions_per_day: Infinity,
    conversations_per_month: Infinity,
  },
};

export interface UsageStatus {
  canUseAI: boolean;
  canCreateConversation: boolean;
  aiSuggestionsUsed: number;
  aiSuggestionsLimit: number;
  aiSuggestionsRemaining: number;
  conversationsUsed: number;
  conversationsLimit: number;
  conversationsRemaining: number;
  resetAiAt: Date;
  resetConversationsAt: Date;
  tier: 'free' | 'starter' | 'pro';
}

/**
 * Get current usage status for a business
 */
export async function getUsageStatus(businessId: string): Promise<UsageStatus | null> {
  const { data: business, error } = await supabase
    .from('businesses')
    .select('ai_suggestions_used_today, ai_suggestions_reset_at, conversations_used_this_month, conversations_reset_at, subscription_tier')
    .eq('id', businessId)
    .single();

  if (error || !business) {
    console.error('Error fetching usage:', error);
    return null;
  }

  // Check if we need to reset counters
  const now = new Date();
  let aiUsed = business.ai_suggestions_used_today || 0;
  let conversationsUsed = business.conversations_used_this_month || 0;
  let aiResetAt = new Date(business.ai_suggestions_reset_at);
  let conversationsResetAt = new Date(business.conversations_reset_at);

  // Reset AI suggestions if needed (daily)
  if (now >= aiResetAt) {
    aiUsed = 0;
    aiResetAt = getNextDayReset();
    await resetAiSuggestions(businessId, aiResetAt);
  }

  // Reset conversations if needed (monthly)
  if (now >= conversationsResetAt) {
    conversationsUsed = 0;
    conversationsResetAt = getNextMonthReset();
    await resetConversations(businessId, conversationsResetAt);
  }

  const tier = (business.subscription_tier || 'free') as 'free' | 'starter' | 'pro';
  const limits = TIER_LIMITS[tier];

  const aiRemaining = Math.max(0, limits.ai_suggestions_per_day - aiUsed);
  const conversationsRemaining = Math.max(0, limits.conversations_per_month - conversationsUsed);

  return {
    canUseAI: aiUsed < limits.ai_suggestions_per_day,
    canCreateConversation: conversationsUsed < limits.conversations_per_month,
    aiSuggestionsUsed: aiUsed,
    aiSuggestionsLimit: limits.ai_suggestions_per_day,
    aiSuggestionsRemaining: aiRemaining,
    conversationsUsed,
    conversationsLimit: limits.conversations_per_month,
    conversationsRemaining,
    resetAiAt: aiResetAt,
    resetConversationsAt: conversationsResetAt,
    tier,
  };
}

/**
 * Increment AI suggestion usage
 */
export async function incrementAiUsage(businessId: string): Promise<boolean> {
  const status = await getUsageStatus(businessId);

  if (!status || !status.canUseAI) {
    return false; // Limit reached
  }

  const { error } = await supabase
    .from('businesses')
    .update({
      ai_suggestions_used_today: status.aiSuggestionsUsed + 1,
    })
    .eq('id', businessId);

  if (error) {
    console.error('Error incrementing AI usage:', error);
    return false;
  }

  return true;
}

/**
 * Increment conversation usage
 */
export async function incrementConversationUsage(businessId: string): Promise<boolean> {
  const status = await getUsageStatus(businessId);

  if (!status || !status.canCreateConversation) {
    return false; // Limit reached
  }

  const { error } = await supabase
    .from('businesses')
    .update({
      conversations_used_this_month: status.conversationsUsed + 1,
    })
    .eq('id', businessId);

  if (error) {
    console.error('Error incrementing conversation usage:', error);
    return false;
  }

  return true;
}

/**
 * Reset AI suggestions counter (called daily)
 */
async function resetAiSuggestions(businessId: string, nextReset: Date): Promise<void> {
  await supabase
    .from('businesses')
    .update({
      ai_suggestions_used_today: 0,
      ai_suggestions_reset_at: nextReset.toISOString(),
    })
    .eq('id', businessId);
}

/**
 * Reset conversations counter (called monthly)
 */
async function resetConversations(businessId: string, nextReset: Date): Promise<void> {
  await supabase
    .from('businesses')
    .update({
      conversations_used_this_month: 0,
      conversations_reset_at: nextReset.toISOString(),
    })
    .eq('id', businessId);
}

/**
 * Get next daily reset time (midnight UTC)
 */
function getNextDayReset(): Date {
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  return tomorrow;
}

/**
 * Get next monthly reset time (1st of next month, midnight UTC)
 */
function getNextMonthReset(): Date {
  const nextMonth = new Date();
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1, 1);
  nextMonth.setUTCHours(0, 0, 0, 0);
  return nextMonth;
}

/**
 * Check if business can use AI suggestions
 */
export async function canUseAiSuggestion(businessId: string): Promise<boolean> {
  const status = await getUsageStatus(businessId);
  return status?.canUseAI ?? false;
}

/**
 * Check if business can create conversations
 */
export async function canCreateConversation(businessId: string): Promise<boolean> {
  const status = await getUsageStatus(businessId);
  return status?.canCreateConversation ?? false;
}
