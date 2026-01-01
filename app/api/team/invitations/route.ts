import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { authenticateRequest } from '@/lib/api/auth-middleware';
import { sendEmail } from '@/lib/api/email';
import { randomBytes } from 'crypto';

// GET /api/team/invitations?businessId=xxx
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.success) return auth.response;

  const { businessId } = auth.data;

  try {
    const { data, error } = await supabaseAdmin
      .from('team_invitations')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ invitations: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}

// POST /api/team/invitations
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, undefined, ['owner', 'admin']);
  if (!auth.success) return auth.response;

  const { businessId, userId } = auth.data;

  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role required' }, { status: 400 });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invitation, error } = await supabaseAdmin
      .from('team_invitations')
      .insert({
        business_id: businessId,
        email: email.toLowerCase(),
        role,
        invited_by: userId,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

    return NextResponse.json({ invitation, inviteUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/team/invitations?businessId=xxx&invitationId=xxx - Send invitation email
export async function PATCH(request: NextRequest) {
  const auth = await authenticateRequest(request, undefined, ['owner', 'admin']);
  if (!auth.success) return auth.response;

  const { businessId } = auth.data;
  const invitationId = request.nextUrl.searchParams.get('invitationId');

  if (!invitationId) {
    return NextResponse.json({ error: 'invitationId required' }, { status: 400 });
  }

  try {
    // Get the invitation details
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('team_invitations')
      .select('*, businesses(name)')
      .eq('id', invitationId)
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`;
    const businessName = (invitation.businesses as any)?.name || 'the team';

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date(invitation.expires_at);
    const expirationDate = expiresAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send email
    await sendEmail({
      to: invitation.email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@inbox-forge.com',
      subject: `You've been invited to join ${businessName} on InboxForge`,
      text: `You've been invited to join ${businessName} on InboxForge!\n\nClick the link below to accept the invitation:\n${inviteUrl}\n\n⏰ This invitation will expire on ${expirationDate}.\n\nIf you can't find this email later, ask your team admin to resend the invitation.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; margin-bottom: 16px;">You've been invited!</h2>
          <p style="font-size: 16px; color: #374151; margin-bottom: 12px;">You've been invited to join <strong>${businessName}</strong> on InboxForge.</p>
          <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">Click the button below to accept the invitation:</p>

          <a href="${inviteUrl}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Accept Invitation</a>

          <div style="margin-top: 32px; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⏰ Expires:</strong> ${expirationDate}
            </p>
            <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px;">
              Can't find this email later? Ask your team admin to resend the invitation.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="color: #2563eb; word-break: break-all;">${inviteUrl}</span>
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to send invitation email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

// DELETE /api/team/invitations?businessId=xxx&invitationId=xxx
export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest(request, undefined, ['owner', 'admin']);
  if (!auth.success) return auth.response;

  const { businessId } = auth.data;
  const invitationId = request.nextUrl.searchParams.get('invitationId');

  if (!invitationId) {
    return NextResponse.json({ error: 'invitationId required' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin
      .from('team_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)
      .eq('business_id', businessId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 });
  }
}
