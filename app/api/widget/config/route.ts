import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { isValidWidgetKey } from '@/lib/chat-widget';
import { shouldAutoReplyChat } from '@/lib/auto-reply';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * Public widget config lookup. The widget key is a public embed identifier —
 * this returns only what the chat bubble needs to render, never business data.
 */
export async function GET(request: NextRequest) {
  if (!rateLimit(`widget-config:${getClientIp(request)}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const key = request.nextUrl.searchParams.get('key');
  if (!isValidWidgetKey(key)) {
    return NextResponse.json({ error: 'Invalid widget key' }, { status: 400 });
  }

  const { data: business } = await supabaseServer
    .from('businesses')
    .select('name, widget_enabled, widget_color, widget_greeting, auto_reply_enabled, subscription_tier, auto_reply_mode, auto_reply_start, auto_reply_end, chat_auto_reply_mode')
    .eq('widget_key', key)
    .single();

  // Live chat is a Pro feature; a downgraded business's widget stops resolving
  if (!business || !business.widget_enabled || business.subscription_tier !== 'pro') {
    return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
  }

  return NextResponse.json({
    businessName: business.name,
    greeting: business.widget_greeting || null,
    color: business.widget_color || '#7c3aed',
    // Whether the AI front desk would answer a chat right now
    aiActive: shouldAutoReplyChat(business),
  });
}
