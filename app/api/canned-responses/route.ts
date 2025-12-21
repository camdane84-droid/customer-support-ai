import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';

// GET - Fetch all canned responses for a business
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const businessId = searchParams.get('businessId');

  if (!businessId) {
    return NextResponse.json(
      { error: 'Business ID is required' },
      { status: 400 }
    );
  }

  console.log('📋 Fetching canned responses for business:', businessId);

  const { data, error } = await supabaseAdmin
    .from('canned_responses')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching canned responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch canned responses', details: error.message },
      { status: 500 }
    );
  }

  console.log('✅ Fetched', data?.length || 0, 'canned responses');

  return NextResponse.json({ responses: data || [] });
}

// POST - Create new canned response
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { business_id, title, content, shortcut, category } = body;

  if (!business_id || !title || !content) {
    return NextResponse.json(
      { error: 'business_id, title, and content are required' },
      { status: 400 }
    );
  }

  console.log('📝 Creating canned response:', title);

  const { data, error } = await supabaseAdmin
    .from('canned_responses')
    .insert({
      business_id,
      title,
      content,
      shortcut: shortcut || null,
      category: category || null,
      usage_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating canned response:', error);
    return NextResponse.json(
      { error: 'Failed to create canned response', details: error.message },
      { status: 500 }
    );
  }

  console.log('✅ Created canned response:', data.id);

  return NextResponse.json({ response: data });
}
