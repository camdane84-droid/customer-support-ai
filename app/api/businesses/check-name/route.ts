import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';

// GET /api/businesses/check-name?name=Business+Name
// Check if a business name is already taken
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessName = searchParams.get('name');

    if (!businessName || businessName.trim().length === 0) {
      return NextResponse.json(
        { available: true },
        { status: 200 }
      );
    }

    // Check if business with this name exists
    // We'll use the slugified version for accurate matching
    const { data: slugData } = await supabaseAdmin.rpc('slugify', {
      text: businessName,
    });

    if (!slugData) {
      return NextResponse.json({ available: true });
    }

    const { data: existingBusiness } = await supabaseAdmin
      .from('businesses')
      .select('id, name')
      .eq('name_slug', slugData)
      .maybeSingle();

    if (existingBusiness) {
      return NextResponse.json({
        available: false,
        existingName: existingBusiness.name,
      });
    }

    return NextResponse.json({ available: true });
  } catch (error: any) {
    console.error('Error checking business name:', error);
    // On error, assume available to not block signup
    return NextResponse.json({ available: true });
  }
}
