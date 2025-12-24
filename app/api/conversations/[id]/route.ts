import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';

// PUT /api/conversations/[id] - Update conversation (mark as read or change status)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const conversationId = params.id;
    const body = await request.json();

    console.log('✏️ Updating conversation:', conversationId, body);

    // Build update object based on what's provided
    const updates: any = {};

    if ('unread_count' in body) {
      updates.unread_count = body.unread_count;
    }

    if ('status' in body) {
      updates.status = body.status;
      // If archiving, add archived_at timestamp if column exists
      if (body.status === 'archived') {
        updates.archived_at = new Date().toISOString();
      }
    }

    // Default to marking as read if no body provided
    if (Object.keys(updates).length === 0) {
      updates.unread_count = 0;
    }

    let result = await supabaseAdmin
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();

    // If archived_at column doesn't exist, try without it
    if (result.error && result.error.message?.includes('archived_at')) {
      console.log('⚠️ archived_at column not found, updating without it');
      delete updates.archived_at;
      result = await supabaseAdmin
        .from('conversations')
        .update(updates)
        .eq('id', conversationId)
        .select()
        .single();
    }

    if (result.error) {
      console.error('❌ Failed to update conversation:', result.error);
      return NextResponse.json(
        { error: 'Failed to update conversation', details: result.error.message },
        { status: 500 }
      );
    }

    console.log('✅ Successfully updated conversation');

    return NextResponse.json(
      { success: true, message: 'Conversation updated', conversation: result.data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error updating conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id] - Archive a conversation
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const conversationId = params.id;
    const body = await request.json();
    const archiveType = body.archive_type || 'archived'; // Default to 'archived' if not specified

    console.log('📦 Archiving conversation:', conversationId, 'Type:', archiveType);

    // First, try to update with archived_at and archive_type (if columns exist)
    let result = await supabaseAdmin
      .from('conversations')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        archive_type: archiveType,
      })
      .eq('id', conversationId)
      .select()
      .single();

    // If archived_at column doesn't exist, try without it but keep archive_type
    if (result.error && result.error.message?.includes('archived_at')) {
      console.log('⚠️ archived_at column not found, updating without it');
      result = await supabaseAdmin
        .from('conversations')
        .update({
          status: 'archived',
          archive_type: archiveType,
        })
        .eq('id', conversationId)
        .select()
        .single();
    }

    // If archive_type column also doesn't exist, try without both
    if (result.error && result.error.message?.includes('archive_type')) {
      console.log('⚠️ archive_type column not found, updating without optional columns');
      result = await supabaseAdmin
        .from('conversations')
        .update({
          status: 'archived',
        })
        .eq('id', conversationId)
        .select()
        .single();
    }

    if (result.error) {
      console.error('❌ Failed to archive conversation:', result.error);
      return NextResponse.json(
        {
          error: 'Failed to archive conversation',
          details: result.error.message,
          hint: result.error.hint,
        },
        { status: 500 }
      );
    }

    console.log('✅ Successfully archived conversation:', conversationId);

    return NextResponse.json(
      { success: true, message: 'Conversation archived successfully', conversation: result.data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error archiving conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Delete a conversation and all its messages
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const conversationId = params.id;

    console.log('🗑️ Deleting conversation:', conversationId);

    // First, delete all messages in the conversation
    const { error: messagesError } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (messagesError) {
      console.error('❌ Failed to delete messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to delete messages' },
        { status: 500 }
      );
    }

    console.log('✅ Deleted messages for conversation:', conversationId);

    // Then, delete the conversation itself
    const { error: conversationError } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (conversationError) {
      console.error('❌ Failed to delete conversation:', conversationError);
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      );
    }

    console.log('✅ Successfully deleted conversation:', conversationId);

    return NextResponse.json(
      { success: true, message: 'Conversation deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error deleting conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
