import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';

// GET /api/team/invitations/[token] - Get invitation details by token (public, no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  try {
    const { data: invitation, error } = await supabaseAdmin
      .from('team_invitations')
      .select('*, businesses(id, name)')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or expired' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      businessName: (invitation.businesses as any)?.name || 'Unknown Business',
      email: invitation.email,
      role: invitation.role,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch invitation details' },
      { status: 500 }
    );
  }
}
