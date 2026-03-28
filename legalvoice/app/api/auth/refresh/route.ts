import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/features/auth/firebase-admin';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/app/lib/auth/tokenVerifier';

/**
 * POST /api/auth/refresh
 * Refreshes authentication tokens when they're about to expire
 */
export async function POST(request: NextRequest) {
  try {
    // Verify current auth state to get user info
    const verification = await verifyAuthToken(request);
    
    if (!verification.isValid || !verification.uid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid authentication state',
      }, { status: 401 });
    }
    
    // Get user from Firebase Admin
    const user = await auth.getUser(verification.uid);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }
    
    // Create a new custom token for the user
    const customToken = await auth.createCustomToken(user.uid);
    
    // Set session expiration to 14 days (maximum allowed)
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days in milliseconds
    
    // Update cookies with new tokens
    const cookieStore = cookies();
    
    // Set auth_token cookie with the new token
    cookieStore.set({
      name: 'auth_token',
      value: customToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn / 1000
    });
    
    // Return success response with new token
    return NextResponse.json({
      success: true,
      token: customToken,
      expiresAt: new Date(Date.now() + expiresIn).toISOString()
    });
  } catch (error) {
    console.error('Error refreshing auth token:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to refresh authentication',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 