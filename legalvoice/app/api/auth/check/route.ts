import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/app/lib/auth/tokenVerifier';
import { auth } from '@/app/features/auth/firebase-admin';

/**
 * POST /api/auth/check
 * Checks the current authentication status and session validity
 * 
 * Headers:
 * - X-Force-Refresh: If "true", will indicate that client should create a new session
 */
export async function POST(request: NextRequest) {
  try {
    const forceRefresh = request.headers.get('X-Force-Refresh') === 'true';
    
    // Get session cookie directly to check if it exists
    const sessionCookie = request.cookies.get('session')?.value;
    const isUsingSession = !!sessionCookie;
    
    // Verify the authentication
    const verification = await verifyAuthToken(request);
    
    // Calculate expiration info if we have a valid session
    let expirationInfo = null;
    
    if (verification.isValid && verification.decodedToken?.exp) {
      const expiresAt = new Date(verification.decodedToken.exp * 1000);
      const expiresIn = verification.decodedToken.exp * 1000 - Date.now();
      
      expirationInfo = {
        expiresAt: expiresAt.toISOString(),
        expiresIn,
        daysRemaining: Math.floor(expiresIn / (1000 * 60 * 60 * 24))
      };
    }
    
    // If token is invalid and we're asked to force a refresh,
    // we'll instruct the client to create a new session
    if (forceRefresh && verification.uid) {
      return NextResponse.json({
        success: true,
        isValid: false,
        uid: verification.uid,
        email: verification.email,
        status: 'refresh_needed',
        reason: 'Force refresh requested',
        code: 'auth/force-refresh-requested',
        sessionType: isUsingSession ? 'session_cookie' : 'id_token'
      });
    }
    
    // If session cookie is expired, instruct client to create a new one
    if (isUsingSession && verification.errorCode === 'auth/session-cookie-expired') {
      return NextResponse.json({
        success: true,
        isValid: false,
        uid: verification.uid,
        email: verification.email,
        status: 'expired',
        reason: 'Session cookie expired',
        code: 'auth/session-expired-create-new',
        sessionType: 'session_cookie'
      });
    }
    
    // Return detailed authentication information
    return NextResponse.json({
      success: true,
      isValid: verification.isValid,
      uid: verification.uid,
      email: verification.email,
      status: verification.isValid ? 'valid' : 'invalid',
      reason: verification.isValid ? null : verification.error,
      code: verification.errorCode,
      sessionType: isUsingSession ? 'session_cookie' : (verification.isValid ? 'id_token' : 'none'),
      // Include detailed expiration info
      ...expirationInfo && { 
        expiresAt: expirationInfo.expiresAt,
        expiresIn: expirationInfo.expiresIn,
        daysRemaining: expirationInfo.daysRemaining
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({
      success: false,
      isValid: false,
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 