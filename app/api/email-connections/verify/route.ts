import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { authenticateRequest } from '@/lib/api/auth-middleware';
import {
  generateVerificationCode,
  sendVerificationEmail,
  VERIFICATION_TTL_MINUTES,
  MAX_VERIFICATION_ATTEMPTS,
} from '@/lib/email-verification';

/**
 * POST /api/email-connections/verify?businessId=xxx
 * Body: { connectionId, code }        — confirm ownership of the address
 * Body: { connectionId, resend: true } — send a fresh code
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, undefined, ['owner', 'admin']);
  if (!auth.success) return auth.response;

  const { businessId } = auth.data;
  const { connectionId, code, resend } = await request.json();

  if (!connectionId) {
    return NextResponse.json({ error: 'connectionId is required' }, { status: 400 });
  }

  const { data: connection, error: connError } = await supabaseAdmin
    .from('social_connections')
    .select('id, platform_user_id, verified, verification_code, verification_expires_at, verification_attempts')
    .eq('id', connectionId)
    .eq('business_id', businessId)
    .eq('platform', 'email')
    .eq('is_active', true)
    .single();

  if (connError || !connection) {
    return NextResponse.json({ error: 'Email connection not found' }, { status: 404 });
  }

  if (connection.verified) {
    return NextResponse.json({ success: true, alreadyVerified: true });
  }

  // Resend a fresh code
  if (resend) {
    const newCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MINUTES * 60 * 1000).toISOString();

    const { error: updateError } = await supabaseAdmin
      .from('social_connections')
      .update({
        verification_code: newCode,
        verification_expires_at: expiresAt,
        verification_attempts: 0,
      })
      .eq('id', connection.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to generate a new code' }, { status: 500 });
    }

    try {
      await sendVerificationEmail(connection.platform_user_id, newCode);
    } catch {
      return NextResponse.json(
        { error: 'Could not send the verification email. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, resent: true });
  }

  // Verify the submitted code
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
  }

  if (connection.verification_attempts >= MAX_VERIFICATION_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Too many attempts. Request a new code.' },
      { status: 429 }
    );
  }

  if (
    !connection.verification_code ||
    !connection.verification_expires_at ||
    new Date(connection.verification_expires_at) < new Date()
  ) {
    return NextResponse.json(
      { error: 'This code has expired. Request a new one.' },
      { status: 400 }
    );
  }

  // Count the attempt before comparing so guesses can't be replayed indefinitely
  await supabaseAdmin
    .from('social_connections')
    .update({ verification_attempts: connection.verification_attempts + 1 })
    .eq('id', connection.id);

  if (code.trim() !== connection.verification_code) {
    const remaining = MAX_VERIFICATION_ATTEMPTS - connection.verification_attempts - 1;
    return NextResponse.json(
      { error: remaining > 0 ? `Incorrect code. ${remaining} attempts left.` : 'Incorrect code. Request a new one.' },
      { status: 400 }
    );
  }

  const { error: verifyError } = await supabaseAdmin
    .from('social_connections')
    .update({
      verified: true,
      verification_code: null,
      verification_expires_at: null,
      verification_attempts: 0,
    })
    .eq('id', connection.id);

  if (verifyError) {
    // Unique index: another business verified this address first
    if (verifyError.code === '23505') {
      return NextResponse.json(
        { error: 'This email is already connected to another workspace' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to verify email connection' }, { status: 500 });
  }

  return NextResponse.json({ success: true, verified: true });
}
