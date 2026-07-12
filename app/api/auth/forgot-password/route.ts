import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { sendEmail } from '@/lib/api/email';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const RESET_LINK_TTL_MINUTES = 60;

/**
 * Public endpoint: request a password reset link.
 *
 * We generate the recovery token server-side and send the email ourselves via
 * Resend instead of supabase.auth.resetPasswordForEmail() for two reasons:
 * - the PKCE reset link only works in the browser that requested it; the
 *   token_hash + verifyOtp flow works on any device
 * - Supabase's built-in SMTP is rate-limited to a couple of emails per hour
 *
 * Always responds { success: true } for valid input so the endpoint can't be
 * used to probe which email addresses have accounts.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!rateLimit(`forgot-password:ip:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many reset requests. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Per-address limit: quietly succeed so repeated requests reveal nothing
    if (!rateLimit(`forgot-password:email:${email}`, 3, 15 * 60 * 1000)) {
      return NextResponse.json({ success: true });
    }

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (error || !data?.properties?.hashed_token) {
      // Unknown address or transient failure — identical response either way
      return NextResponse.json({ success: true });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token_hash=${encodeURIComponent(
      data.properties.hashed_token
    )}`;

    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!fromEmail) {
      console.error('❌ RESEND_FROM_EMAIL is not configured — cannot send reset email');
      return NextResponse.json({ success: true });
    }

    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'InboxForge';

    await sendEmail({
      to: email,
      from: `${companyName} <${fromEmail}>`,
      subject: `Reset your ${companyName} password`,
      text: `We received a request to reset your ${companyName} password.\n\nOpen this link to choose a new one:\n${resetUrl}\n\nThe link expires in ${RESET_LINK_TTL_MINUTES} minutes and can be used once.\n\nIf you didn't request this, you can ignore this email — your password won't change.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <p style="margin: 0 0 16px; color: #111827; font-size: 16px;">
            We received a request to reset your ${companyName} password.
          </p>
          <p style="margin: 0 0 24px;">
            <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 12px 24px; border-radius: 8px;">
              Choose a new password
            </a>
          </p>
          <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
            The link expires in ${RESET_LINK_TTL_MINUTES} minutes and can be used once.
          </p>
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            If you didn't request this, you can ignore this email — your password won't change.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error in forgot-password:', error);
    // Same shape as success — no information leak on failure
    return NextResponse.json({ success: true });
  }
}
