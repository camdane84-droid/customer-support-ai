import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { detectTags } from '@/lib/utils/auto-tagging';

// POST /api/conversations/[id]/analyze - Analyze conversation and update tags
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const conversationId = params.id;

    console.log('🔍 Analyzing conversation:', conversationId);

    // Fetch all messages for this conversation
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('content, sender_type')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('❌ Failed to fetch messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { tags: [], message: 'No messages to analyze' },
        { status: 200 }
      );
    }

    // Detect tags from messages
    const tags = detectTags(messages);
    console.log('🏷️ Detected tags:', tags.map(t => t.label));

    // Update conversation with detected tags
    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({
        tags: tags.map(t => t.id),
        metadata: { auto_tags: tags }
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error('❌ Failed to update conversation tags:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tags' },
        { status: 500 }
      );
    }

    console.log('✅ Successfully analyzed and tagged conversation');

    return NextResponse.json(
      { tags, message: 'Conversation analyzed successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error analyzing conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
