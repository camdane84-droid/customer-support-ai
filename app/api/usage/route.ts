import { NextRequest, NextResponse } from 'next/server';
import { getUsageStatus } from '@/lib/usage/tracker';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    const usageStatus = await getUsageStatus(businessId);

    if (!usageStatus) {
      return NextResponse.json(
        { error: 'Failed to fetch usage status' },
        { status: 500 }
      );
    }

    return NextResponse.json(usageStatus);
  } catch (error: any) {
    console.error('[Usage API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
