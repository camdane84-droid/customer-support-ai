import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';

// GET /api/conversations?businessId=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    console.log('🔍 [API] Fetching conversations for business:', businessId);

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('business_id', businessId)
      .neq('status', 'archived')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('❌ [API] Error fetching conversations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ [API] Fetched', data?.length || 0, 'conversations');

    return NextResponse.json({ conversations: data || [] });
  } catch (error: any) {
    console.error('❌ [API] Exception fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
