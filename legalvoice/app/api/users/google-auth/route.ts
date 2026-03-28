import { NextRequest } from 'next/server';
import { apiResponse, apiErrorResponse } from '@/app/lib/utils/apiHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';

// Handle Google sign-in - create or update user in MongoDB
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
    const { db } = await connectToDatabase();
    
    // Check if user already exists in MongoDB
    const existingUser = await db.collection('users').findOne({ uid });
    
    if (existingUser) {
      // Update existing user's last login and return
      await db.collection('users').updateOne(
        { uid },
        { 
          $set: { 
            lastLogin: new Date().toISOString(),
            photoURL: photoURL || existingUser.photoURL, // Update photo if provided
            displayName: displayName || existingUser.displayName // Update name if provided
          } 
        }
      );
      
      return apiResponse({ 
        success: true, 
        user: {
          ...existingUser,
          lastLogin: new Date().toISOString(),
          photoURL: photoURL || existingUser.photoURL,
          displayName: displayName || existingUser.displayName
        },
        isNewUser: false
      });
    }
    
    // Create new user document for Google sign-in
    const newUser = {
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      photoURL: photoURL || null,
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: 'user',
      isVerified: true, // Google users are considered verified since email is verified
      authProvider: 'google',
      credits: 15, // Extra credits for Google sign-in users
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
      },
      isNewUser: true
    });
    
  } catch (error: any) {
    console.error('Error processing Google sign-in:', error);
    return apiErrorResponse(
      'google_auth_failed',
      error.message || 'Failed to process Google sign-in',
      null,
      500
    );
  }
} 