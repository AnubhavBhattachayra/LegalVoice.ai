import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/features/auth/firebase-admin';

/**
 * POST /api/auth/sessionLogout
 * Clears the session cookie and optionally revokes all refresh tokens
 * 
 * Query parameters:
 * - revoke: If "true", also revokes all refresh tokens for the user
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const shouldRevoke = request.nextUrl.searchParams.get('revoke') === 'true';
    
    // Clear all cookies
    cookieStore.delete('session');
    cookieStore.delete('user_email');
    cookieStore.delete('user_name');
    cookieStore.delete('user_uid');
    cookieStore.delete('firebase_auth_token');
    cookieStore.delete('auth_token');
    
    // If we have a session cookie and should revoke tokens
    if (sessionCookie && shouldRevoke) {
      try {
        // Verify the session cookie to get the user ID
        const decodedClaims = await auth.verifySessionCookie(sessionCookie);
        
        // Revoke refresh tokens for the user to force full re-authentication
        await auth.revokeRefreshTokens(decodedClaims.sub);
        
        console.log(`Revoked refresh tokens for user: ${decodedClaims.sub}`);
      } catch (verifyError) {
        console.error('Error verifying session cookie during logout:', verifyError);
        // Continue with logout even if verification fails
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully logged out',
      tokensRevoked: shouldRevoke && !!sessionCookie
    });
  } catch (error) {
    console.error('Error during logout:', error);
    
    // Still clear cookies even if there was an error
    const cookieStore = cookies();
    cookieStore.delete('session');
    cookieStore.delete('user_email');
    cookieStore.delete('user_name');
    cookieStore.delete('user_uid');
    cookieStore.delete('firebase_auth_token');
    cookieStore.delete('auth_token');
    
    return NextResponse.json({
      success: false,
      error: 'Error during logout',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 