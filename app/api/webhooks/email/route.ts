import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // SendGrid sends email data as form fields
    const from = formData.get('from') as string;
    const to = formData.get('to') as string;
    const subject = formData.get('subject') as string;
    const text = formData.get('text') as string;
    const html = formData.get('html') as string;

    console.log('📧 Email received:', { from, to, subject });

    // Extract sender email and name
    const fromMatch = from.match(/(.*?)\s*<(.+?)>/) || [null, from, from];
    const senderName = fromMatch[1]?.trim() || fromMatch[2];
    const senderEmail = fromMatch[2] || from;

    // Get business by support email (the "to" address)
    const businessEmail = to.match(/<(.+?)>/)?.[1] || to;
    const { data: business } = await supabaseServer
      .from('businesses')
      .select('*')
      .eq('email', businessEmail)
      .single();

    if (!business) {
      console.error('❌ No business found for email:', businessEmail);
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Find or create conversation
    let { data: conversation } = await supabaseServer
      .from('conversations')
      .select('*')
      .eq('business_id', business.id)
      .eq('customer_email', senderEmail)
      .eq('channel', 'email')
      .single();

    if (!conversation) {
      console.log('📝 Creating new conversation for:', senderEmail);
      const { data: newConvo, error: convoError } = await supabaseServer
        .from('conversations')
        .insert({
          business_id: business.id,
          customer_name: senderName,
          customer_email: senderEmail,
          channel: 'email',
          status: 'open',
        })
        .select()
        .single();

      if (convoError) throw convoError;
      conversation = newConvo;
    }

    // Create message
    const content = text || html || subject;
    await supabaseServer.from('messages').insert({
      conversation_id: conversation.id,
      business_id: business.id,
      sender_type: 'customer',
      sender_name: senderName,
      content: content,
      channel: 'email',
      metadata: {
        subject: subject,
        from_email: senderEmail,
      },
    });

    console.log('✅ Email message saved');
    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('❌ Email webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  return new NextResponse('Email webhook is ready', { status: 200 });
}
