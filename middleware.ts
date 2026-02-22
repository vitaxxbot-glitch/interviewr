import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'interviewr';
const COOKIE = 'interviewr_auth';

// Routes that require admin auth
const ADMIN_ROUTES = ['/', '/dashboard'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect admin routes (not /interview/* or /api/interviews/*/chat)
  const isAdminRoute = pathname === '/' || pathname.startsWith('/dashboard');
  const isAdminApi = pathname.startsWith('/api/interviews') && !pathname.includes('/chat') && req.method !== 'GET';

  if (!isAdminRoute && !isAdminApi) return NextResponse.next();

  // Allow login page
  if (pathname === '/login') return NextResponse.next();

  // Check cookie
  const token = req.cookies.get(COOKIE)?.value;
  if (token === ADMIN_PASS) return NextResponse.next();

  // Redirect to login
  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/api/interviews/:path*/route'],
};
