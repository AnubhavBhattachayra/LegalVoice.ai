import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { withAuth } from '@/app/lib/utils/authMiddleware';
import { createSuccessApiResponse, createErrorApiResponse } from '@/app/lib/utils/apiHelpers';
import crypto from 'crypto';

/**
 * Generate a secure CSRF token
 */
function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate CSRF token for authenticated users
 */
export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Generate CSRF token
    const token = generateCSRFToken();
    
    // Store token in a cookie (secure, http-only)
    const cookieStore = cookies();
    cookieStore.set('csrf_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/'
    });
    
    // Send token in response - client will include this in request headers
    return createSuccessApiResponse({
      csrfToken: token
    });
  } catch (error: any) {
    console.error('Error generating CSRF token:', error);
    return createErrorApiResponse(
      'csrf_error',
      'Failed to generate CSRF token',
      null,
      500
    );
  }
});

/**
 * Validate CSRF token
 * 
 * @param token The token to validate
 * @returns Boolean indicating if token is valid
 */
export function validateCSRFToken(token: string): boolean {
  const cookieStore = cookies();
  const storedToken = cookieStore.get('csrf_token')?.value;
  
  if (!storedToken || !token) {
    return false;
  }
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken)
  );
}

/**
 * Middleware to verify CSRF token
 */
export function withCSRF(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return withAuth(async (req: NextRequest, user: any) => {
    // Skip CSRF check for GET requests (they should be idempotent)
    if (req.method === 'GET') {
      return handler(req, user);
    }
    
    // Get CSRF token from header
    const csrfToken = req.headers.get('X-CSRF-Token');
    
    if (!csrfToken) {
      return createErrorApiResponse(
        'csrf_missing',
        'CSRF token is required',
        null,
        403
      );
    }
    
    // Validate token
    if (!validateCSRFToken(csrfToken)) {
      return createErrorApiResponse(
        'csrf_invalid',
        'Invalid or expired CSRF token',
        null,
        403
      );
    }
    
    // Token is valid, proceed to handler
    return handler(req, user);
  });
} 