/**
 * Mail-loop protection (RFC 3834): decides whether an inbound email came from
 * a machine rather than a person, so the AI never auto-replies to newsletters,
 * out-of-office bots, delivery notifications, or no-reply addresses.
 *
 * Automated mail is still ingested and classified — order confirmations and
 * alerts are exactly what the triage AI is for. Only the *reply* is suppressed:
 * replying to a machine is useless at best and an infinite loop at worst.
 */

const HEADER_SIGNALS: Array<{ pattern: RegExp; reason: string }> = [
  // RFC 3834: anything except "no" marks generated mail (auto-generated, auto-replied, ...)
  // Whitespace lives inside the lookahead — a consumable \s* before it could
  // backtrack to zero width and defeat the "no" exemption.
  { pattern: /^auto-submitted:(?![ \t]*no\s*$)/im, reason: 'Auto-Submitted header' },
  // De-facto standard on newsletters, list mail, and many autoresponders
  { pattern: /^precedence:\s*(bulk|junk|list|auto_reply)/im, reason: 'Precedence header' },
  // Microsoft: sender explicitly asks receiving systems not to auto-respond
  { pattern: /^x-auto-response-suppress:/im, reason: 'X-Auto-Response-Suppress header' },
  // Mailing lists / marketing mail
  { pattern: /^list-(id|unsubscribe):/im, reason: 'mailing-list headers' },
  // Legacy autoresponder markers
  { pattern: /^x-auto(reply|respond):/im, reason: 'autoresponder header' },
  // Bounce reports
  { pattern: /^x-failed-recipients:/im, reason: 'bounce report header' },
];

// Local parts that never belong to a human who wants a reply
const NO_REPLY_SENDER =
  /^(no[-._]?reply|do[-._]?not[-._]?reply|postmaster|mailer[-._]?daemon|bounces?)([+._-].*)?$/i;

/**
 * Returns a human-readable reason to skip the AI auto-reply, or null when the
 * message looks like it came from a person.
 *
 * @param rawHeaders full raw header block (SendGrid Inbound Parse `headers` field)
 * @param senderEmail parsed From address
 */
export function getAutoReplySuppressionReason(
  rawHeaders: string | null | undefined,
  senderEmail: string
): string | null {
  if (rawHeaders) {
    for (const { pattern, reason } of HEADER_SIGNALS) {
      if (pattern.test(rawHeaders)) return reason;
    }
  }

  const localPart = senderEmail.trim().toLowerCase().split('@')[0] || '';
  if (NO_REPLY_SENDER.test(localPart)) {
    return `no-reply sender (${localPart}@…)`;
  }

  return null;
}
