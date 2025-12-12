import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';

export async function GET() {
  try {
    // Get all social connections (including inactive)
    const { data: connections, error } = await supabaseAdmin
      .from('social_connections')
      .select('*')
      .eq('platform', 'instagram');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      connections: connections,
      count: connections?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
