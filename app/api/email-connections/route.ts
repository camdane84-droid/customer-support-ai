import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { authenticateRequest } from '@/lib/api/auth-middleware';
import { generateVerificationCode, sendVerificationEmail, VERIFICATION_TTL_MINUTES } from '@/lib/email-verification';
import { generateForwardingAddress, assignForwardingAddress, getInboundParseDomain } from '@/lib/forwarding';

// Columns safe to return to the client (never the verification code)
const PUBLIC_COLUMNS = 'id, platform_user_id, platform_username, metadata, is_active, verified, forwarding_address, forwarding_confirmed_at, created_at';

// GET /api/email-connections?businessId=xxx
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.success) return auth.response;

  const { businessId } = auth.data;

  // Ensure the primary business email has a connection row so it can get
  // forwarding setup like any other address. It carries the same trust as the
  // webhook's businesses.email fallback, so it starts verified — unless
  // another workspace already holds a verified claim on it.
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('email')
    .eq('id', businessId)
    .single();

  const primaryEmail = business?.email?.trim().toLowerCase();
  if (primaryEmail) {
    const { data: primaryConn } = await supabaseAdmin
      .from('social_connections')
      .select('id')
      .eq('business_id', businessId)
      .eq('platform', 'email')
      .eq('platform_user_id', primaryEmail)
      .maybeSingle();

    if (!primaryConn) {
      const primaryRow = {
        business_id: businessId,
        platform: 'email',
        platform_user_id: primaryEmail,
        platform_username: primaryEmail,
        is_active: true,
        metadata: { label: 'Primary' },
        forwarding_address: generateForwardingAddress(primaryEmail),
      };

      const { error: insertError } = await supabaseAdmin
        .from('social_connections')
        .insert({ ...primaryRow, verified: true });

      if (insertError?.code === '23505') {
        await supabaseAdmin
          .from('social_connections')
          .insert({ ...primaryRow, forwarding_address: generateForwardingAddress(primaryEmail), verified: false });
      }
    }
  }

  const { data, error } = await supabaseAdmin
    .from('social_connections')
    .select(PUBLIC_COLUMNS)
    .eq('business_id', businessId)
    .eq('platform', 'email')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch email connections' }, { status: 500 });
  }

  // Lazily assign forwarding addresses to connections created before this
  // feature (or before INBOUND_PARSE_DOMAIN was configured)
  const connections = data || [];
  if (getInboundParseDomain()) {
    for (const conn of connections) {
      if (!conn.forwarding_address) {
        conn.forwarding_address = await assignForwardingAddress(conn.id, conn.platform_user_id, supabaseAdmin);
      }
    }
  }

  return NextResponse.json({ connections });
}

// POST /api/email-connections — add a new email connection (starts unverified;
// a 6-digit code is emailed to the address and must be confirmed via /verify)
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, undefined, ['owner', 'admin']);
  if (!auth.success) return auth.response;

  const { businessId } = auth.data;
  const { email, label } = await request.json();

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  // Another business already verified this address
  const { data: claimedByOther } = await supabaseAdmin
    .from('social_connections')
    .select('id')
    .eq('platform', 'email')
    .eq('platform_user_id', normalizedEmail)
    .eq('is_active', true)
    .eq('verified', true)
    .neq('business_id', businessId)
    .maybeSingle();

  if (claimedByOther) {
    return NextResponse.json(
      { error: 'This email is already connected to another workspace' },
      { status: 409 }
    );
  }

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MINUTES * 60 * 1000).toISOString();

  // Existing row for this business (verified, pending, or soft-deleted)
  const { data: existing } = await supabaseAdmin
    .from('social_connections')
    .select('id, is_active, verified, forwarding_address')
    .eq('business_id', businessId)
    .eq('platform', 'email')
    .eq('platform_user_id', normalizedEmail)
    .single();

  let connection;

  if (existing) {
    if (existing.is_active && existing.verified) {
      return NextResponse.json({ error: 'This email is already connected' }, { status: 409 });
    }

    // Pending or previously removed — restart verification with a fresh code.
    // Keep the existing forwarding address so an already-configured rule keeps working.
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('social_connections')
      .update({
        is_active: true,
        verified: false,
        platform_username: normalizedEmail,
        metadata: label ? { label } : null,
        verification_code: code,
        verification_expires_at: expiresAt,
        verification_attempts: 0,
        forwarding_address: existing.forwarding_address || generateForwardingAddress(normalizedEmail),
      })
      .eq('id', existing.id)
      .select(PUBLIC_COLUMNS)
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to add email connection' }, { status: 500 });
    }
    connection = updated;
  } else {
    // Retry once if the random forwarding address collides
    let inserted = null;
    let insertError = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await supabaseAdmin
        .from('social_connections')
        .insert({
          business_id: businessId,
          platform: 'email',
          platform_user_id: normalizedEmail,
          platform_username: normalizedEmail,
          is_active: true,
          verified: false,
          metadata: label ? { label } : null,
          verification_code: code,
          verification_expires_at: expiresAt,
          verification_attempts: 0,
          forwarding_address: generateForwardingAddress(normalizedEmail),
        })
        .select(PUBLIC_COLUMNS)
        .single();

      inserted = result.data;
      insertError = result.error;
      if (!insertError || insertError.code !== '23505') break;
    }

    if (insertError || !inserted) {
      return NextResponse.json({ error: 'Failed to add email connection' }, { status: 500 });
    }
    connection = inserted;
  }

  // Prove ownership: the code only ever goes to the address being connected
  try {
    await sendVerificationEmail(normalizedEmail, code);
  } catch {
    return NextResponse.json(
      { error: 'Could not send the verification email. Please try again.', connection, requiresVerification: true },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { connection, requiresVerification: true },
    { status: existing ? 200 : 201 }
  );
}

// DELETE /api/email-connections?businessId=xxx&connectionId=yyy
export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest(request, undefined, ['owner', 'admin']);
  if (!auth.success) return auth.response;

  const { businessId } = auth.data;
  const connectionId = request.nextUrl.searchParams.get('connectionId');

  if (!connectionId) {
    return NextResponse.json({ error: 'connectionId is required' }, { status: 400 });
  }

  // Check whether this would remove the last working (verified) email connection
  const { data: target } = await supabaseAdmin
    .from('social_connections')
    .select('verified')
    .eq('id', connectionId)
    .eq('business_id', businessId)
    .eq('platform', 'email')
    .single();

  if (target?.verified) {
    const { count } = await supabaseAdmin
      .from('social_connections')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('platform', 'email')
      .eq('is_active', true)
      .eq('verified', true);

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove the last email connection' },
        { status: 400 }
      );
    }
  }

  // Soft-delete (is_active = false); verification must be redone on reconnect
  const { error } = await supabaseAdmin
    .from('social_connections')
    .update({ is_active: false, verified: false, verification_code: null })
    .eq('id', connectionId)
    .eq('business_id', businessId)
    .eq('platform', 'email');

  if (error) {
    return NextResponse.json({ error: 'Failed to remove email connection' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
