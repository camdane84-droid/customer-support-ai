import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { isValidWidgetKey } from '@/lib/chat-widget';
import { shouldAutoReply } from '@/lib/auto-reply';

/**
 * Public widget config lookup. The widget key is a public embed identifier —
 * this returns only what the chat bubble needs to render, never business data.
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (!isValidWidgetKey(key)) {
    return NextResponse.json({ error: 'Invalid widget key' }, { status: 400 });
  }

  const { data: business } = await supabaseServer
    .from('businesses')
    .select('name, widget_enabled, widget_color, widget_greeting, auto_reply_enabled, subscription_tier, auto_reply_mode, auto_reply_start, auto_reply_end')
    .eq('widget_key', key)
    .single();

  if (!business || !business.widget_enabled) {
    return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
  }

  return NextResponse.json({
    businessName: business.name,
    greeting: business.widget_greeting || null,
    color: business.widget_color || '#7c3aed',
    // Whether the AI front desk would answer right now (after-hours schedule etc.)
    aiActive: shouldAutoReply(business),
  });
}
