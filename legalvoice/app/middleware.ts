import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from './lib/utils/tokenStorage';

// Define paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/api/auth/setToken',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/getToken',
  '/api/csrf'
];

// Define paths that always require CSRF token validation
const CSRF_PROTECTED_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/user/profile',
  '/api/billing/update-payment',
  '/api/billing/subscribe'
];

// Check if a path is public
const isPublicPath = (path: string): boolean => {
  return PUBLIC_PATHS.some(publicPath => {
    // Exact match
    if (publicPath === path) return true;
    // Check for paths with extensions (e.g., .js, .css, .png)
    if (path.match(/\.(js|css|png|jpg|jpeg|svg|ico|json)$/)) return true;
    // Check if it's a nested public path
    if (publicPath.endsWith('*') && path.startsWith(publicPath.slice(0, -1))) return true;
    return false;
  });
};

// Check if a path requires CSRF protection
const requiresCsrfProtection = (path: string): boolean => {
  return CSRF_PROTECTED_PATHS.some(protectedPath => {
    // Exact match
    if (protectedPath === path) return true;
    // Check if it's a nested protected path
    if (protectedPath.endsWith('*') && path.startsWith(protectedPath.slice(0, -1))) return true;
    return false;
  });
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // For API routes that require CSRF protection
  if (requiresCsrfProtection(pathname)) {
    const csrfToken = request.cookies.get('csrf_token')?.value;
    const requestCsrfToken = request.headers.get('X-CSRF-Token');

    if (!csrfToken || !requestCsrfToken || csrfToken !== requestCsrfToken) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }
  }

  // For all other routes, check authentication
  const token = getToken(request.cookies);
  
  if (!token) {
    // If this is an API route
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Redirect to login page for non-API routes
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    url.searchParams.set('sessionExpired', 'true');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except for static files and api routes explicitly excluded
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 