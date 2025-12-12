import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { sendEmail } from '@/lib/api/email';
import { logError } from '@/lib/services/errorLogger';
import type { Message } from '@/lib/api/supabase';

export async function POST(request: NextRequest) {
  try {
    const message = await request.json();

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
      console.error('Error creating message:', error);
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

    // If this is a business reply, try to send it
    if (message.sender_type === 'business') {
      try {
        if (message.channel === 'email') {
          await handleEmailSend(data, message.business_id);
        } else if (message.channel === 'instagram') {
          await handleInstagramSend(data, message.business_id);
        }

        // Update status to sent
        await supabaseServer
          .from('messages')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', data.id);

        console.log(`✅ ${message.channel} message sent successfully`);
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
        console.error(`Failed to send ${message.channel} message:`, sendError);
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in messages API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
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
  // Get conversation for Instagram ID
  const { data: conversation } = await supabaseServer
    .from('conversations')
    .select('customer_instagram_id')
    .eq('id', message.conversation_id)
    .single();

  if (!conversation?.customer_instagram_id) {
    throw new Error('Missing Instagram ID');
  }

  // Get Instagram connection with access token
  const { data: connection } = await supabaseServer
    .from('social_connections')
    .select('access_token, platform_user_id')
    .eq('business_id', businessId)
    .eq('platform', 'instagram')
    .eq('is_active', true)
    .single();

  if (!connection?.access_token) {
    throw new Error('Instagram not connected or access token missing');
  }

  // Send via Instagram Messaging API (using Instagram user ID, not /me)
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${connection.platform_user_id}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: conversation.customer_instagram_id },
        message: { text: message.content },
        access_token: connection.access_token, // Use stored page access token
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Instagram API error:', error);
    throw new Error(error.error?.message || 'Failed to send Instagram message');
  }

  const result = await response.json();
  console.log('✅ Instagram message sent:', result);
}
