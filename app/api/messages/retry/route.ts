import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { sendEmail } from '@/lib/api/email';
import { logError } from '@/lib/services/errorLogger';
import type { Message } from '@/lib/api/supabase';

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
        await handleEmailSend(message, message.business_id);
      } else if (message.channel === 'instagram') {
        await handleInstagramSend(message, message.business_id);
      }

      // Update to sent
      await supabaseServer
        .from('messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      console.log(`✅ Message ${messageId} retry successful`);
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

      console.error(`Failed to retry message ${messageId}:`, sendError);
      throw sendError;
    }
  } catch (error: any) {
    console.error('Error in retry API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retry message' },
      { status: 500 }
    );
  }
}

async function handleEmailSend(message: Message, businessId: string) {
  // Only send if SendGrid is configured
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_API_KEY.startsWith('SG.')) {
    console.log('📧 Email reply saved (SendGrid not configured)');
    throw new Error('Email service not configured. Please add SENDGRID_API_KEY to your environment variables.');
  }

  // Get conversation details
  const { data: conversation, error: convError } = await supabaseServer
    .from('conversations')
    .select('customer_email, customer_name')
    .eq('id', message.conversation_id)
    .single();

  if (convError) {
    console.error('Failed to fetch conversation:', convError);
    throw new Error(`Failed to fetch conversation: ${convError.message}`);
  }

  // Get business details
  const { data: business, error: bizError } = await supabaseServer
    .from('businesses')
    .select('email, name')
    .eq('id', businessId)
    .single();

  if (bizError) {
    console.error('Failed to fetch business:', bizError);
    throw new Error(`Failed to fetch business: ${bizError.message}`);
  }

  if (!conversation?.customer_email) {
    throw new Error('Customer email not found in conversation');
  }

  if (!business?.email) {
    throw new Error('Business email not found');
  }

  console.log(`📧 Sending email from ${business.email} to ${conversation.customer_email}`);

  try {
    await sendEmail({
      to: conversation.customer_email,
      from: business.email,
      subject: `Re: Message from ${business.name}`,
      text: message.content,
    });
    console.log('✅ Email sent successfully');
  } catch (emailError: any) {
    console.error('SendGrid error:', emailError);
    throw new Error(`Email delivery failed: ${emailError.message}`);
  }
}

async function handleInstagramSend(message: Message, businessId: string) {
  console.log('📸 Sending Instagram message...');

  // Get the Instagram connection with access token
  const { data: connection, error: connError } = await supabaseServer
    .from('social_connections')
    .select('*')
    .eq('business_id', businessId)
    .eq('platform', 'instagram')
    .eq('is_active', true)
    .single();

  if (connError || !connection) {
    console.error('No Instagram connection found:', connError);
    throw new Error('Instagram not connected');
  }

  // Use access token from database, or fall back to env variable
  const accessToken = connection.access_token || process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('No access token in connection or environment');
    throw new Error('Instagram access token missing');
  }

  console.log('Using access token from:', connection.access_token ? 'database' : 'environment');

  // Get conversation for recipient Instagram ID
  const { data: conversation } = await supabaseServer
    .from('conversations')
    .select('customer_instagram_id')
    .eq('id', message.conversation_id)
    .single();

  if (!conversation?.customer_instagram_id) {
    throw new Error('Customer Instagram ID not found');
  }

  console.log('📤 Sending Instagram DM...');
  console.log('To Instagram ID:', conversation.customer_instagram_id);
  console.log('From Account ID:', connection.platform_user_id);

  // Use Facebook Graph API for Instagram Business messaging
  const url = `https://graph.facebook.com/v21.0/${connection.platform_user_id}/messages?access_token=${accessToken}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: {
        id: conversation.customer_instagram_id,
      },
      message: {
        text: message.content,
      },
    }),
  });

  const responseData = await response.json();
  console.log('Instagram API response:', responseData);

  if (!response.ok) {
    console.error('❌ Instagram send failed:', responseData);
    throw new Error(responseData.error?.message || 'Failed to send Instagram message');
  }

  console.log('✅ Instagram message sent!');
}
