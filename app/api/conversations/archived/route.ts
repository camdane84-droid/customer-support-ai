import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';

// GET /api/conversations/archived - Get all archived conversations for a business
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('business_id');

    if (!businessId) {
      return NextResponse.json(
        { error: 'business_id is required' },
        { status: 400 }
      );
    }

    console.log('📦 Fetching archived conversations for business:', businessId);

    // Try to fetch with archived_at ordering first
    let result = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'archived')
      .order('archived_at', { ascending: false });

    // If archived_at column doesn't exist, try ordering by last_message_at instead
    if (result.error && result.error.message?.includes('archived_at')) {
      console.log('⚠️ archived_at column not found, using last_message_at for ordering');
      result = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'archived')
        .order('last_message_at', { ascending: false });
    }

    if (result.error) {
      console.error('❌ Failed to fetch archived conversations:', result.error);
      return NextResponse.json(
        { error: 'Failed to fetch archived conversations', details: result.error.message },
        { status: 500 }
      );
    }

    const conversations = result.data;

    console.log(`✅ Found ${conversations.length} archived conversations`);

    return NextResponse.json(
      { conversations },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error fetching archived conversations:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
