import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasMetaAppId: !!process.env.META_APP_ID,
    hasMetaAppSecret: !!process.env.META_APP_SECRET,
    hasPublicMetaAppId: !!process.env.NEXT_PUBLIC_META_APP_ID,
    hasPublicAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    metaAppIdValue: process.env.META_APP_ID || 'MISSING',
    publicAppUrlValue: process.env.NEXT_PUBLIC_APP_URL || 'MISSING',
    // Don't expose actual secrets, just show they exist
    metaAppSecretLength: process.env.META_APP_SECRET?.length || 0,
  });
}
