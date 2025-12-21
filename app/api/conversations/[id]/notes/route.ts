import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';

// POST /api/conversations/[id]/notes - Save notes for a conversation
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const conversationId = params.id;
    const body = await request.json();
    const { notes } = body;

    console.log('📝 Saving notes for conversation:', conversationId);

    const { error } = await supabaseAdmin
      .from('conversations')
      .update({ notes })
      .eq('id', conversationId);

    if (error) {
      console.error('❌ Failed to save notes:', error);
      return NextResponse.json(
        { error: 'Failed to save notes', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Notes saved successfully');

    return NextResponse.json({ success: true, message: 'Notes saved successfully' });
  } catch (error: any) {
    console.error('❌ Error saving notes:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
