import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { canCreateConversation, incrementConversationUsage } from '@/lib/usage/tracker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, businessId, customerName, customerContact, message, subject } = body;

    if (!channel || !businessId || !customerName || !customerContact || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: channel, businessId, customerName, customerContact, message' },
        { status: 400 }
      );
    }

    if (!['email', 'whatsapp', 'instagram'].includes(channel)) {
      return NextResponse.json(
        { error: 'Invalid channel. Must be email, whatsapp, or instagram' },
        { status: 400 }
      );
    }

    // Verify business exists
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('id, email')
      .eq('id', businessId)
      .single();

    if (!business || bizError) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (channel === 'email') {
      return await simulateEmail(business, customerName, customerContact, message, subject, request);
    } else if (channel === 'whatsapp') {
      return await simulateWhatsApp(business, customerName, customerContact, message);
    } else {
      return await simulateInstagram(business, customerName, customerContact, message);
    }
  } catch (error: any) {
    console.error('Simulate message error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

async function simulateEmail(
  business: { id: string; email: string },
  customerName: string,
  customerEmail: string,
  message: string,
  subject: string | undefined,
  request: NextRequest
) {
  // Build the internal webhook URL
  const url = new URL('/api/webhooks/email', request.url);

  const formData = new FormData();
  formData.append('from', `${customerName} <${customerEmail}>`);
  formData.append('to', business.email);
  formData.append('subject', subject || 'No Subject');
  formData.append('text', message);

  const response = await fetch(url.toString(), {
    method: 'POST',
    body: formData,
  });

  if (response.ok) {
    return NextResponse.json({ success: true, message: 'Email simulated successfully' });
  } else {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    return NextResponse.json(
      { error: error.error || 'Failed to simulate email' },
      { status: response.status }
    );
  }
}

async function simulateWhatsApp(
  business: { id: string; email: string },
  customerName: string,
  customerPhone: string,
  message: string
) {
  const now = new Date();

  // Find or create conversation
  const { data: existingConv } = await supabaseAdmin
    .from('conversations')
    .select('id, unread_count')
    .eq('business_id', business.id)
    .eq('customer_phone', customerPhone)
    .eq('channel', 'whatsapp')
    .single();

  let conversationId: string;

  if (existingConv) {
    conversationId = existingConv.id;

    await supabaseAdmin
      .from('conversations')
      .update({
        last_message_at: now.toISOString(),
        unread_count: (existingConv.unread_count || 0) + 1,
        status: 'open',
      })
      .eq('id', conversationId);
  } else {
    const canCreate = await canCreateConversation(business.id);
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Conversation limit reached for your plan' },
        { status: 403 }
      );
    }

    const { data: newConv, error: createError } = await supabaseAdmin
      .from('conversations')
      .insert({
        business_id: business.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        channel: 'whatsapp',
        status: 'open',
        unread_count: 1,
        last_message_at: now.toISOString(),
      })
      .select('id')
      .single();

    if (createError || !newConv) {
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    conversationId = newConv.id;
    await incrementConversationUsage(business.id);
  }

  // Insert message
  const { error: msgError } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      business_id: business.id,
      sender_type: 'customer',
      sender_name: customerName,
      content: message,
      channel: 'whatsapp',
      is_ai_suggested: false,
      metadata: {
        simulated: true,
        customer_phone: customerPhone,
      },
    });

  if (msgError) {
    return NextResponse.json({ error: 'Failed to insert message' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'WhatsApp message simulated successfully' });
}

async function simulateInstagram(
  business: { id: string; email: string },
  customerName: string,
  customerInstagramId: string,
  message: string
) {
  const now = new Date();

  // Find or create conversation
  const { data: existingConv } = await supabaseAdmin
    .from('conversations')
    .select('id, unread_count')
    .eq('business_id', business.id)
    .eq('customer_instagram_id', customerInstagramId)
    .eq('channel', 'instagram')
    .single();

  let conversationId: string;

  if (existingConv) {
    conversationId = existingConv.id;

    await supabaseAdmin
      .from('conversations')
      .update({
        last_message_at: now.toISOString(),
        unread_count: (existingConv.unread_count || 0) + 1,
        status: 'open',
      })
      .eq('id', conversationId);
  } else {
    const canCreate = await canCreateConversation(business.id);
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Conversation limit reached for your plan' },
        { status: 403 }
      );
    }

    const { data: newConv, error: createError } = await supabaseAdmin
      .from('conversations')
      .insert({
        business_id: business.id,
        customer_name: `@${customerName}`,
        customer_instagram_id: customerInstagramId,
        channel: 'instagram',
        status: 'open',
        unread_count: 1,
        last_message_at: now.toISOString(),
      })
      .select('id')
      .single();

    if (createError || !newConv) {
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    conversationId = newConv.id;
    await incrementConversationUsage(business.id);
  }

  // Insert message
  const { error: msgError } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      business_id: business.id,
      sender_type: 'customer',
      sender_name: `@${customerName}`,
      content: message,
      channel: 'instagram',
      is_ai_suggested: false,
      metadata: {
        simulated: true,
        sender_id: customerInstagramId,
      },
    });

  if (msgError) {
    return NextResponse.json({ error: 'Failed to insert message' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Instagram message simulated successfully' });
}
