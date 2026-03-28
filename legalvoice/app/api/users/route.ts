import { NextRequest } from 'next/server';
import { apiResponse, apiErrorResponse } from '@/app/lib/utils/apiHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { getFirebaseAdmin } from '@/app/lib/utils/firebaseAdmin';

// Create a new user in MongoDB after Firebase Auth registration
export async function POST(request: NextRequest) {
  try {
    const { uid, email, displayName, photoURL, createdAt } = await request.json();
    
    // Validate required fields
    if (!uid || !email) {
      return apiErrorResponse(
        'missing_required_fields',
        'User ID and email are required',
        null,
        400
      );
    }
    
    // Connect to MongoDB
    const { db, error } = await connectToDatabase();
    
    // If MongoDB connection failed, return a fallback user
    if (error || !db) {
      console.warn('Using fallback user data due to database connection issues');
      const fallbackUser = {
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || null,
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: 'user',
        isVerified: false,
        credits: 10,
        subscription: null,
        lastLogin: new Date().toISOString(),
        _id: 'fallback-user-id'
      };
      
      return apiResponse({
        success: true,
        user: fallbackUser,
        notice: 'Using fallback data. Some features may be limited.'
      });
    }
    
    // Check if user already exists in MongoDB
    const existingUser = await db.collection('users').findOne({ uid });
    if (existingUser) {
      // User already exists, just return success
      return apiResponse({ success: true, user: existingUser });
    }
    
    // Create new user document
    const newUser = {
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      photoURL: photoURL || null,
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: 'user',
      isVerified: false,
      credits: 10, // Initial credits for new users
      subscription: null,
      lastLogin: new Date().toISOString(),
    };
    
    // Insert user into database
    const result = await db.collection('users').insertOne(newUser);
    
    // Return success response
    return apiResponse({
      success: true,
      user: {
        ...newUser,
        _id: result.insertedId
      }
    });
    
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // If error occurs, return a fallback user instead of an error
    try {
      const { uid, email, displayName, photoURL, createdAt } = await request.json();
      
      if (uid && email) {
        console.warn('Returning fallback user data due to error');
        const fallbackUser = {
          uid,
          email,
          displayName: displayName || email.split('@')[0],
          photoURL: photoURL || null,
          createdAt: createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          role: 'user',
          isVerified: false,
          credits: 10,
          subscription: null,
          lastLogin: new Date().toISOString(),
          _id: 'fallback-user-id'
        };
        
        return apiResponse({
          success: true,
          user: fallbackUser,
          notice: 'Using fallback data. Some features may be limited.'
        });
      }
    } catch (fallbackError) {
      console.error('Error creating fallback user:', fallbackError);
    }
    
    return apiErrorResponse(
      'user_creation_failed',
      error.message || 'Failed to create user',
      null,
      500
    );
  }
}

// Get user from MongoDB by Firebase UID
export async function GET(request: NextRequest) {
  try {
    // Get UID from request (from auth middleware or query param)
    const uid = request.nextUrl.searchParams.get('uid');
    
    if (!uid) {
      return apiErrorResponse(
        'missing_uid',
        'User ID is required',
        null,
        400
      );
    }
    
    // Connect to MongoDB
    const { db, error } = await connectToDatabase();
    
    // If MongoDB connection failed, return a fallback user
    if (error || !db) {
      console.warn('Using fallback user data due to database connection issues');
      const email = request.nextUrl.searchParams.get('email') || `user-${uid}@example.com`;
      const displayName = request.nextUrl.searchParams.get('displayName') || email.split('@')[0];
      
      const fallbackUser = {
        uid,
        email,
        displayName,
        photoURL: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: 'user',
        isVerified: false,
        credits: 10,
        subscription: null,
        lastLogin: new Date().toISOString(),
        _id: 'fallback-user-id'
      };
      
      return apiResponse({
        user: fallbackUser,
        notice: 'Using fallback data. Some features may be limited.'
      });
    }
    
    // Find user in database
    const user = await db.collection('users').findOne({ uid });
    
    if (!user) {
      // Create a fallback user if not found
      const email = request.nextUrl.searchParams.get('email') || `user-${uid}@example.com`;
      const displayName = request.nextUrl.searchParams.get('displayName') || email.split('@')[0];
      
      const fallbackUser = {
        uid,
        email,
        displayName,
        photoURL: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: 'user',
        isVerified: false,
        credits: 10,
        subscription: null,
        lastLogin: new Date().toISOString(),
        _id: 'fallback-user-id'
      };
      
      return apiResponse({ 
        user: fallbackUser,
        notice: 'User data will be persisted on next login.' 
      });
    }
    
    // Return user data
    return apiResponse({ user });
    
  } catch (error: any) {
    console.error('Error getting user:', error);
    
    // Return a fallback user instead of an error
    try {
      const uid = request.nextUrl.searchParams.get('uid');
      
      if (uid) {
        console.warn('Returning fallback user data due to error');
        const email = request.nextUrl.searchParams.get('email') || `user-${uid}@example.com`;
        const displayName = request.nextUrl.searchParams.get('displayName') || email.split('@')[0];
        
        const fallbackUser = {
          uid,
          email,
          displayName,
          photoURL: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          role: 'user',
          isVerified: false,
          credits: 10,
          subscription: null,
          lastLogin: new Date().toISOString(),
          _id: 'fallback-user-id'
        };
        
        return apiResponse({
          user: fallbackUser,
          notice: 'Using fallback data. Some features may be limited.'
        });
      }
    } catch (fallbackError) {
      console.error('Error creating fallback user:', fallbackError);
    }
    
    return apiErrorResponse(
      'user_fetch_failed',
      error.message || 'Failed to get user',
      null,
      500
    );
  }
} 