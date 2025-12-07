import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // Clean up old entries
  if (record && now > record.resetAt) {
    rateLimitMap.delete(identifier);
  }

  const current = rateLimitMap.get(identifier);

  if (!current) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { success: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { success: false, remaining: 0 };
  }

  current.count++;
  return { success: true, remaining: limit - current.count };
}

export function rateLimitMiddleware(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 60000
): NextResponse | null {
  // Use IP address as identifier
  const ip = request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              'unknown';

  const result = rateLimit(ip, limit, windowMs);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(windowMs / 1000)),
        },
      }
    );
  }

  return null;
}
