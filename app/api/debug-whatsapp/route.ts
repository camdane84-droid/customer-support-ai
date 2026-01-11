import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';

export async function GET() {
  try {
    // Get all WhatsApp connections
    const { data: connections, error } = await supabaseAdmin
      .from('social_connections')
      .select('*')
      .eq('platform', 'whatsapp');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      connections: connections?.map(c => ({
        id: c.id,
        business_id: c.business_id,
        platform_username: c.platform_username,
        phone_number_id: c.metadata?.phone_number_id,
        is_active: c.is_active,
        created_at: c.created_at,
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
