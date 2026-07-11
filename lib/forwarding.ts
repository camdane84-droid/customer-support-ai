import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

/**
 * Forwarding-based email onboarding.
 *
 * Each email connection gets a unique parse address on INBOUND_PARSE_DOMAIN
 * (a domain whose MX records point at SendGrid Inbound Parse). Businesses
 * auto-forward their existing mailbox to it, so they never touch their own
 * DNS. Forwarded mail is routed by the SMTP envelope recipient.
 */

export function getInboundParseDomain(): string | null {
  return process.env.INBOUND_PARSE_DOMAIN?.trim().toLowerCase() || null;
}

/**
 * Builds a forwarding address like "support-a3f9@in.yourdomain.com" from the
 * connected email's local part. The random suffix keeps addresses unguessable
 * and collision-free.
 */
export function generateForwardingAddress(email: string): string | null {
  const domain = getInboundParseDomain();
  if (!domain) return null;

  const localPart = email.split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'inbox';

  const suffix = crypto.randomBytes(2).toString('hex');
  return `${localPart}-${suffix}@${domain}`;
}

/**
 * Assigns a forwarding address to a connection that doesn't have one yet.
 * Retries once on the (unlikely) unique-index collision.
 */
export async function assignForwardingAddress(
  connectionId: string,
  email: string,
  supabase: SupabaseClient
): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const address = generateForwardingAddress(email);
    if (!address) return null;

    const { error } = await supabase
      .from('social_connections')
      .update({ forwarding_address: address })
      .eq('id', connectionId)
      .is('forwarding_address', null);

    if (!error) return address;
    if (error.code !== '23505') {
      logger.error('Failed to assign forwarding address', error, { connectionId });
      return null;
    }
  }
  return null;
}

/** Extracts envelope recipients from SendGrid Inbound Parse's `envelope` field. */
export function parseEnvelopeRecipients(envelopeRaw: string | null): string[] {
  if (!envelopeRaw) return [];
  try {
    const envelope = JSON.parse(envelopeRaw);
    const to = Array.isArray(envelope?.to) ? envelope.to : [];
    return to.filter((a: unknown): a is string => typeof a === 'string').map((a: string) => a.toLowerCase());
  } catch {
    return [];
  }
}

/** Returns the first envelope recipient on our parse domain, if any. */
export function findParseRecipient(envelopeRecipients: string[]): string | null {
  const domain = getInboundParseDomain();
  if (!domain) return null;
  return envelopeRecipients.find(a => a.endsWith(`@${domain}`)) || null;
}

export interface GmailForwardingConfirmation {
  code: string | null;
  link: string | null;
  sourceEmail: string | null;
  receivedAt: string;
}

/**
 * Detects Gmail's forwarding-confirmation email (sent by Google to the
 * forwarding destination when a user adds it in Gmail settings).
 * Subject looks like: "(#794523142) Gmail Forwarding Confirmation - Receive Mail from user@gmail.com"
 */
export function isGmailForwardingConfirmation(fromEmail: string, subject: string): boolean {
  return (
    fromEmail.toLowerCase().includes('forwarding-noreply@google.com') ||
    /gmail forwarding confirmation/i.test(subject || '')
  );
}

/**
 * Best-effort parse of the confirmation code, verification link, and source
 * address. Google may change the format, so the raw email is also kept in the
 * conversation-free metadata for manual fallback.
 */
export function parseGmailForwardingConfirmation(
  subject: string,
  text: string
): GmailForwardingConfirmation {
  const combined = `${subject || ''}\n${text || ''}`;

  const codeMatch =
    (subject || '').match(/\(#(\d{6,})\)/) ||
    combined.match(/confirmation code[:\s]+(\d{6,})/i);

  const linkMatch = combined.match(/https:\/\/mail-settings\.google\.com\/\S+/);

  const sourceMatch =
    (subject || '').match(/from\s+([^\s<>]+@[^\s<>]+)\s*$/i) ||
    combined.match(/([^\s<>]+@[^\s<>]+)\s+has requested/i);

  return {
    code: codeMatch?.[1] || null,
    link: linkMatch?.[0]?.replace(/[.,)\]]+$/, '') || null,
    sourceEmail: sourceMatch?.[1]?.toLowerCase() || null,
    receivedAt: new Date().toISOString(),
  };
}
