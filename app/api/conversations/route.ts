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
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('business_id', businessId)
      .neq('status', 'archived')
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
