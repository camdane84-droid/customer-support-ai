import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logError } from '@/lib/services/errorLogger';
import { authenticateRequest } from '@/lib/api/auth-middleware';
import { logger } from '@/lib/logger';
import {
  handleEmailSend,
  handleInstagramSend,
  handleWhatsAppSend,
  handleTikTokSend,
  checkIfSimulated,
} from '@/lib/channel-senders';

export async function POST(request: NextRequest) {
  try {
    const message = await request.json();

    // Authenticate and authorize - verify user owns this business
    const auth = await authenticateRequest(request, message.business_id);
    if (!auth.success) {
      logger.error('[MESSAGES] Authentication failed', undefined, { businessId: message.business_id });
      return auth.response;
    }

    logger.info('[MESSAGES] User authenticated', {
      userId: auth.data.userId,
      businessId: auth.data.businessId,
      role: auth.data.role,
      channel: message.channel
    });

    // Save message to database with 'sending' status if it's a business reply
    const messageData = {
      ...message,
      status: message.sender_type === 'business' ? 'sending' : 'sent',
      sent_at: message.sender_type === 'customer' ? new Date().toISOString() : null,
    };

    const { data, error } = await supabaseServer
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      await logError({
        businessId: message.business_id,
        errorType: 'message_creation_failed',
        errorMessage: error.message,
        context: { message },
      });
      throw error;
    }

    // Update conversation's last_message_at
    await supabaseServer
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', message.conversation_id);

    // If this is a customer message, trigger auto-notes (fire and forget)
    if (message.sender_type === 'customer' && process.env.NEXT_PUBLIC_APP_URL) {
      // Don't await - let it run in background
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/conversations/${message.conversation_id}/auto-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {
        // Auto-notes failure is non-critical
      });
    }

    // If this is a business reply, try to send it
    if (message.sender_type === 'business') {
      // Check if this conversation was created by the simulator
      const isSimulated = await checkIfSimulated(message.conversation_id, supabaseServer);

      try {
        if (isSimulated) {
          // Simulated conversations: skip external API, just mark as sent
          logger.info('[MESSAGES] Simulated conversation - skipping external delivery', {
            conversationId: message.conversation_id,
            channel: message.channel,
          });
        } else if (message.channel === 'email') {
          await handleEmailSend(data, message.business_id, supabaseServer);
        } else if (message.channel === 'instagram') {
          await handleInstagramSend(data, message.business_id, supabaseServer);
        } else if (message.channel === 'whatsapp') {
          await handleWhatsAppSend(data, message.business_id, supabaseServer);
        } else if (message.channel === 'tiktok') {
          await handleTikTokSend(data, message.business_id, supabaseServer);
        }

        // Update status to sent
        await supabaseServer
          .from('messages')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', data.id);
      } catch (sendError: any) {
        // Update status to failed
        await supabaseServer
          .from('messages')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
            error_message: sendError.message,
          })
          .eq('id', data.id);

        await logError({
          businessId: message.business_id,
          errorType: `${message.channel}_send_failed`,
          errorMessage: sendError.message,
          context: {
            message_id: data.id,
            conversation_id: message.conversation_id,
          },
        });

        // Don't throw - message is saved, just delivery failed
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
