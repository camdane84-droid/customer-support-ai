import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { logger } from '@/lib/logger';

// GET /api/conversations/[id]/messages
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const conversationId = params.id;

    logger.debug('[API] Fetching messages for conversation', { conversationId });

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('[API] Error fetching messages', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages', details: error.message },
        { status: 500 }
      );
    }

    logger.debug('[API] Fetched messages', { count: data?.length || 0 });

    return NextResponse.json({ messages: data || [] });
  } catch (error: any) {
    logger.error('[API] Exception fetching messages', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
