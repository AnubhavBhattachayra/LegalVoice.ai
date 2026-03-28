import { NextRequest } from 'next/server';
import { createSuccessApiResponse, createErrorApiResponse } from '@/app/lib/utils/apiHelpers';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

// Generate CSRF token
export async function GET() {
  // Create a new CSRF token
  const csrfToken = crypto.randomBytes(16).toString('hex');
  
  // Store it in a cookie with HTTP-only flag
  const cookieStore = cookies();
  cookieStore.set({
    name: 'csrf_token',
    value: csrfToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 // 1 hour
  });
  
  // Return token to the client - format response with status field for backwards compatibility
  return NextResponse.json({ 
    status: 'success',
    data: { csrfToken }
  }, { status: 200 });
}

// Verify CSRF token from request
export async function POST(request: NextRequest) {
  try {
    const { csrfToken } = await request.json();
    
    // Get stored token from cookie
    const cookieStore = cookies();
    const storedToken = cookieStore.get('csrf_token')?.value;
    
    if (!storedToken) {
      return NextResponse.json({
        status: 'error',
        error: {
          code: 'csrf_token_missing',
          message: 'CSRF token not found in cookies. Please refresh and try again.'
        }
      }, { status: 403 });
    }
    
    if (csrfToken !== storedToken) {
      return NextResponse.json({
        status: 'error',
        error: {
          code: 'csrf_token_invalid',
          message: 'CSRF token is invalid. Please refresh and try again.'
        }
      }, { status: 403 });
    }
    
    // If we get here, the CSRF token is valid
    return NextResponse.json({
      status: 'success',
      data: { success: true }
    }, { status: 200 });
  } catch (error) {
    console.error('Error validating CSRF token:', error);
    return NextResponse.json({
      status: 'error',
      error: {
        code: 'internal_error',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 });
  }
} 