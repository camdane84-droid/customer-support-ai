import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';

// PUT - Update canned response
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const responseId = params.id;
  const body = await request.json();
  const { title, content, shortcut, category } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: 'title and content are required' },
      { status: 400 }
    );
  }

  logger.info('Updating canned response', { responseId });

  const { data, error } = await supabaseAdmin
    .from('canned_responses')
    .update({
      title,
      content,
      shortcut: shortcut || null,
      category: category || null,
    })
    .eq('id', responseId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating canned response', error);
    return NextResponse.json(
      { error: 'Failed to update canned response', details: error.message },
      { status: 500 }
    );
  }

  logger.success('Updated canned response', { responseId });

  return NextResponse.json({ response: data });
}

// DELETE - Delete canned response
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const responseId = params.id;

  logger.info('Deleting canned response', { responseId });

  const { error } = await supabaseAdmin
    .from('canned_responses')
    .delete()
    .eq('id', responseId);

  if (error) {
    logger.error('Error deleting canned response', error);
    return NextResponse.json(
      { error: 'Failed to delete canned response', details: error.message },
      { status: 500 }
    );
  }

  logger.success('Deleted canned response', { responseId });

  return NextResponse.json({ success: true, message: 'Canned response deleted' });
}
