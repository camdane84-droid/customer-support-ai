import crypto from 'crypto';
import { sendEmail } from '@/lib/api/email';

export const VERIFICATION_TTL_MINUTES = 30;
export const MAX_VERIFICATION_ATTEMPTS = 5;

export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Sends the ownership-verification code to the address being connected.
 * Whoever controls the mailbox gets the code — that's the proof of ownership.
 */
export async function sendVerificationEmail(to: string, code: string) {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error('RESEND_FROM_EMAIL is not configured');
  }

  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'InboxForge';

  await sendEmail({
    to,
    from: `${companyName} <${fromEmail}>`,
    subject: `${code} is your ${companyName} verification code`,
    text: `Your verification code is: ${code}\n\nEnter this code in ${companyName} settings to confirm you own this email address. The code expires in ${VERIFICATION_TTL_MINUTES} minutes.\n\nIf you didn't request this, you can ignore this email — no one can connect your address without this code.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <p style="margin: 0 0 16px; color: #111827; font-size: 16px;">
          Enter this code in ${companyName} settings to confirm you own this email address:
        </p>
        <p style="margin: 0 0 16px; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #4f46e5;">
          ${code}
        </p>
        <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
          The code expires in ${VERIFICATION_TTL_MINUTES} minutes.
        </p>
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
          If you didn't request this, you can ignore this email — no one can connect your address without this code.
        </p>
      </div>
    `,
  });
}
