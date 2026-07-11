import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

/**
 * Pushes a chat reply to the visitor's widget over Supabase Realtime
 * Broadcast, so replies appear instantly instead of on the next poll.
 *
 * Uses the Broadcast REST endpoint — serverless-friendly, no websocket.
 * The topic is the session's token hash: only the visitor (who holds the
 * raw token) can derive it, so the channel name grants nothing to others.
 * Failures are non-fatal — the widget's polling fallback picks the
 * message up anyway.
 */

export interface BroadcastChatMessage {
  id: string;
  content: string;
  sender_type: string;
  sender_name: string | null;
  created_at: string;
}

export async function broadcastChatMessage(
  supabase: SupabaseClient,
  conversationId: string,
  message: BroadcastChatMessage
): Promise<void> {
  try {
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('token_hash')
      .eq('conversation_id', conversationId)
      .single();

    if (!session?.token_hash) return;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return;

    const res = await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            topic: `chat:${session.token_hash}`,
            event: 'new-message',
            payload: { message },
          },
        ],
      }),
    });

    if (!res.ok) {
      logger.debug('Chat broadcast rejected (widget will poll it up)', { status: res.status });
    }
  } catch (error: any) {
    logger.debug('Chat broadcast failed (widget will poll it up)', { error: error?.message });
  }
}
