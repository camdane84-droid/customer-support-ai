import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow public access to these routes (required for Meta App Review)
  const publicRoutes = [
    '/privacy',
    '/terms',
    '/data-deletion',
    '/api/webhooks',
    '/login',
    '/signup',
    '/pricing',
    '/contact',
    '/',
  ];

  const path = request.nextUrl.pathname;

  // Check if the current path starts with any public route
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

  if (isPublicRoute) {
    // Allow access to public routes
    return NextResponse.next();
  }

  // For all other routes, Next.js will handle auth via AuthContext
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
