import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { authenticateRequest } from '@/lib/api/auth-middleware';

// GET /api/conversations?businessId=xxx
export async function GET(request: NextRequest) {
  // Authenticate and authorize request
  const auth = await authenticateRequest(request);
  if (!auth.success) {
    return auth.response;
  }

  const { businessId } = auth.data;

  try {
    // Optional email channel filter
    const channelAddresses = request.nextUrl.searchParams.get('channelAddresses');

    let query = supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('business_id', businessId)
      .neq('status', 'archived');

    if (channelAddresses) {
      const addresses = channelAddresses.split(',').map(a => a.trim()).filter(Boolean);
      if (addresses.length > 0) {
        // Show non-email conversations always, plus email conversations matching the filter
        query = query.or(`channel.neq.email,channel_address.in.(${addresses.join(',')})`);
      }
    }

    const { data, error } = await query
      .order('last_message_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversations: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
