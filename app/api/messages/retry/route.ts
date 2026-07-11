import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { logError } from '@/lib/services/errorLogger';
import { authenticateRequest } from '@/lib/api/auth-middleware';
import {
  handleEmailSend,
  handleInstagramSend,
  handleWhatsAppSend,
  handleTikTokSend,
} from '@/lib/channel-senders';

export async function POST(request: NextRequest) {
  try {
    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // Get the failed message
    const { data: message, error } = await supabaseServer
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify the caller is a member of the business that owns this message
    const auth = await authenticateRequest(request, message.business_id);
    if (!auth.success) {
      return auth.response;
    }

    if (message.status !== 'failed') {
      return NextResponse.json(
        { error: 'Message is not in failed state' },
        { status: 400 }
      );
    }

    // Update to sending status
    await supabaseServer
      .from('messages')
      .update({
        status: 'sending',
        error_message: null,
        failed_at: null,
      })
      .eq('id', messageId);

    // Try sending again
    try {
      if (message.channel === 'email') {
        await handleEmailSend(message, message.business_id, supabaseServer);
      } else if (message.channel === 'instagram') {
        await handleInstagramSend(message, message.business_id, supabaseServer);
      } else if (message.channel === 'whatsapp') {
        await handleWhatsAppSend(message, message.business_id, supabaseServer);
      } else if (message.channel === 'tiktok') {
        await handleTikTokSend(message, message.business_id, supabaseServer);
      }

      // Update to sent
      await supabaseServer
        .from('messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      logger.info(`✅ Message ${messageId} retry successful`);
      return NextResponse.json({ success: true });
    } catch (sendError: any) {
      // Failed again
      await supabaseServer
        .from('messages')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          error_message: sendError.message,
        })
        .eq('id', messageId);

      await logError({
        businessId: message.business_id,
        errorType: `${message.channel}_retry_failed`,
        errorMessage: sendError.message,
        context: {
          message_id: messageId,
          conversation_id: message.conversation_id,
        },
      });

      logger.error(`Failed to retry message ${messageId}:`, sendError);
      throw sendError;
    }
  } catch (error: any) {
    logger.error('Error in retry API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retry message' },
      { status: 500 }
    );
  }
}
