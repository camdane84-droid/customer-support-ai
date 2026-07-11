import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Chat widget session helpers.
 * Visitors are anonymous: on first message they receive a bearer token that
 * maps (hashed) to a chat_sessions row, which binds them to one conversation.
 * All widget API routes authenticate with this token — never with user auth.
 */

export const CHAT_MESSAGE_MAX_LENGTH = 4000;
export const CHAT_NAME_MAX_LENGTH = 100;
export const CHAT_EMAIL_MAX_LENGTH = 200;

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ChatSession {
  id: string;
  business_id: string;
  conversation_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function isValidWidgetKey(key: string | null): key is string {
  return !!key && UUID_PATTERN.test(key);
}

/** Look up the session for a visitor token. Returns null for unknown/malformed tokens. */
export async function getSessionByToken(
  supabase: SupabaseClient,
  token: string | null
): Promise<ChatSession | null> {
  if (!token || !TOKEN_PATTERN.test(token)) return null;

  const { data } = await supabase
    .from('chat_sessions')
    .select('id, business_id, conversation_id, visitor_name, visitor_email')
    .eq('token_hash', hashSessionToken(token))
    .single();

  return data ?? null;
}

/** Trim and length-cap visitor-supplied text; returns null when empty. */
export function sanitizeVisitorField(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed.length > 0 ? trimmed : null;
}

/** Validate a chat message body; returns the trimmed content or an error string. */
export function validateMessageContent(value: unknown): { content: string } | { error: string } {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { error: 'Message is required' };
  }
  if (value.length > CHAT_MESSAGE_MAX_LENGTH) {
    return { error: `Message is too long (max ${CHAT_MESSAGE_MAX_LENGTH} characters)` };
  }
  return { content: value.trim() };
}
