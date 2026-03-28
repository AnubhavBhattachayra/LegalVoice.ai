import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/features/auth/firebase-admin';

/**
 * POST /api/auth/sessionLogin
 * Exchanges a Firebase ID token for a long-lived session cookie
 * 
 * Request body:
 * - idToken: Firebase ID token from client
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ 
        success: false,
        error: 'ID token is required' 
      }, { status: 400 });
    }
    
    // Verify the ID token first
    const decodedIdToken = await auth.verifyIdToken(idToken);
    
    // Check if the user signed in recently (within last 5 minutes)
    const authTime = decodedIdToken.auth_time;
    const fiveMinutesInSeconds = 5 * 60;
    const now = Math.floor(Date.now() / 1000);
    
    if (now - authTime > fiveMinutesInSeconds) {
      console.warn('Token is older than 5 minutes. Recent sign-in preferred for security.');
      // We'll still proceed, but this is a best practice recommended by Firebase
    }
    
    // Set session expiration to 14 days (maximum allowed)
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days in milliseconds
    
    // Create the session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    
    // Set cookie policy for session cookie
    const cookieStore = cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // Convert to seconds for cookie maxAge
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax'
    });
    
    // Also set the auth_token cookie for API routes
    cookieStore.set('auth_token', idToken, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax'
    });
    
    // Also store user info in non-http-only cookies for client access
    if (decodedIdToken.email) {
      cookieStore.set('user_email', decodedIdToken.email, {
        maxAge: expiresIn / 1000,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax'
      });
    }
    
    if (decodedIdToken.name) {
      cookieStore.set('user_name', decodedIdToken.name, {
        maxAge: expiresIn / 1000,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax'
      });
    }
    
    cookieStore.set('user_uid', decodedIdToken.uid, {
      maxAge: expiresIn / 1000,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax'
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      sessionSet: true,
      expiresAt: new Date(Date.now() + expiresIn).toISOString(),
      uid: decodedIdToken.uid,
      email: decodedIdToken.email
    });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create session',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 401 });
  }
} 