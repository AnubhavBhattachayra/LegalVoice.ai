import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { auth } from '@/app/features/auth/firebase-admin';

/**
 * Get the user from the request's Firebase auth token
 */
export async function getUserFromRequest(request: NextRequest) {
  try {
    // Try to get the token from cookies or authorization header
    const token = 
      request.cookies.get('firebase_auth_token')?.value || 
      request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }
    
    // Verify the Firebase token
    try {
      const decodedToken = await auth.verifyIdToken(token);
      
      if (!decodedToken.email) {
        return null;
      }
      
      // Connect to database
      const { db } = await connectToDatabase();
      
      // Find user by email or firebase uid
      const user = await db.collection('users').findOne({
        $or: [
          { email: decodedToken.email },
          { firebaseUid: decodedToken.uid }
        ]
      });
      
      if (!user) {
        // Create basic user record if not found
        const newUser = {
          email: decodedToken.email,
          firebaseUid: decodedToken.uid,
          name: decodedToken.name || decodedToken.email?.split('@')[0],
          role: 'user',
          isVerified: decodedToken.email_verified || false,
          createdAt: new Date()
        };
        
        const result = await db.collection('users').insertOne(newUser);
        
        return {
          id: result.insertedId.toString(),
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          isVerified: newUser.isVerified
        };
      }
      
      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        isVerified: user.isVerified || false
      };
      
    } catch (error) {
      console.error('Error verifying Firebase token:', error);
      return null;
    }
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

/**
 * Helper function to get authentication status and user for API routes
 * Similar to getServerSession but for Firebase auth
 */
export async function getAuthStatus(req: NextRequest) {
  const user = await getUserFromRequest(req);
  
  return {
    isAuthenticated: !!user,
    user
  };
}

/**
 * Middleware to verify authentication for API routes
 */
export function withAuth(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }
    
    return handler(req, user);
  };
} 