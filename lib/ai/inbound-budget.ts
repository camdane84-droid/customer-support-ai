import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { logger } from '@/lib/logger';

/**
 * Ceiling on automated AI work (notes, classify, auto-reply) triggered by
 * inbound customer messages. Each inbound message can cost up to 3 Claude
 * calls, and the monthly conversation cap doesn't limit messages within an
 * existing conversation — so a chatty sender or a misbehaving autoresponder
 * that slips past the loop guard could otherwise burn AI calls without bound.
 *
 * Counted from the messages table rather than in memory so the limit holds
 * across serverless instances. The current message is already saved when this
 * runs, so it is included in the count.
 */
export const MAX_INBOUND_PER_CONVERSATION_PER_HOUR = 10;
export const MAX_INBOUND_PER_BUSINESS_PER_HOUR = 300;

const HOUR_MS = 60 * 60 * 1000;

export type InboundAiBudget =
  | { allowed: true }
  | { allowed: false; reason: 'conversation_limit' | 'business_limit' };

export async function checkInboundAiBudget(
  businessId: string,
  conversationId: string
): Promise<InboundAiBudget> {
  const since = new Date(Date.now() - HOUR_MS).toISOString();

  const [conversationCount, businessCount] = await Promise.all([
    supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('sender_type', 'customer')
      .gte('created_at', since),
    supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('sender_type', 'customer')
      .gte('created_at', since),
  ]);

  // Fail open on a count error: a transient DB hiccup shouldn't silently stop
  // every auto-reply, and the next message gets checked again.
  if (conversationCount.error || businessCount.error) {
    logger.warn('Inbound AI budget check failed, allowing', {
      conversationId,
      error: conversationCount.error?.message || businessCount.error?.message,
    });
    return { allowed: true };
  }

  if ((conversationCount.count ?? 0) > MAX_INBOUND_PER_CONVERSATION_PER_HOUR) {
    logger.warn('Inbound AI budget exceeded for conversation, skipping AI', {
      businessId,
      conversationId,
      count: conversationCount.count,
    });
    return { allowed: false, reason: 'conversation_limit' };
  }

  if ((businessCount.count ?? 0) > MAX_INBOUND_PER_BUSINESS_PER_HOUR) {
    logger.warn('Inbound AI budget exceeded for business, skipping AI', {
      businessId,
      conversationId,
      count: businessCount.count,
    });
    return { allowed: false, reason: 'business_limit' };
  }

  return { allowed: true };
}
