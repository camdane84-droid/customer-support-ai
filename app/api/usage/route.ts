import { NextRequest, NextResponse } from 'next/server';
import { getUsageStatus } from '@/lib/usage/tracker';
import { authenticateRequest } from '@/lib/api/auth-middleware';

export async function GET(request: NextRequest) {
  // Authenticate and authorize request
  const auth = await authenticateRequest(request);
  if (!auth.success) {
    return auth.response;
  }

  const { businessId } = auth.data;

  try {
    const usageStatus = await getUsageStatus(businessId);

    if (!usageStatus) {
      return NextResponse.json(
        { error: 'Failed to fetch usage status' },
        { status: 500 }
      );
    }

    return NextResponse.json(usageStatus);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
