import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    META_APP_ID: process.env.META_APP_ID ? 'Set' : 'Missing',
    NEXT_PUBLIC_META_APP_ID: process.env.NEXT_PUBLIC_META_APP_ID ? 'Set' : 'Missing',
    META_APP_SECRET: process.env.META_APP_SECRET ? 'Set' : 'Missing',

    // What the client will use
    clientRedirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`,

    // What should be in Meta Dashboard
    expectedMetaRedirectUri: 'https://customer-support-ai-one-beta.vercel.app/api/auth/instagram/callback',
  });
}
