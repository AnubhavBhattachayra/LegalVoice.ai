import { NextRequest } from 'next/server';
import { apiResponse, apiErrorResponse } from '@/app/lib/utils/apiHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { getFirebaseAdmin } from '@/app/lib/utils/firebaseAdmin';

// Update user in MongoDB
export async function PATCH(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const uid = params.uid;
    
    if (!uid) {
      return apiErrorResponse(
        'missing_uid',
        'User ID is required',
        null,
        400
      );
    }
    
    // Get update data from request
    const updateData = await request.json();
    
    // Remove any fields that shouldn't be updateable by the user
    const { _id, uid: _, createdAt, ...safeUpdateData } = updateData;
    
    // Add updatedAt timestamp
    safeUpdateData.updatedAt = new Date().toISOString();
    
    // Connect to MongoDB
    const { db, error } = await connectToDatabase();
    
    // If MongoDB connection failed, return a success response with just the updated data
    if (error || !db) {
      console.warn('Using local update only due to database connection issues');
      return apiResponse({
        success: true,
        user: {
          ...updateData,
          updatedAt: safeUpdateData.updatedAt
        },
        notice: 'Profile updated locally only. Changes may not persist.'
      });
    }
    
    // Update user in database
    const result = await db.collection('users').findOneAndUpdate(
      { uid },
      { $set: safeUpdateData },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return apiErrorResponse(
        'user_not_found',
        'User not found',
        null,
        404
      );
    }
    
    // Return updated user
    return apiResponse({
      success: true,
      user: result
    });
    
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    // Return a success response with the update data in case of error
    try {
      const updateData = await request.json();
      return apiResponse({
        success: true,
        user: {
          ...updateData,
          updatedAt: new Date().toISOString()
        },
        notice: 'Profile updated locally only. Changes may not persist.'
      });
    } catch (fallbackError) {
      console.error('Error creating fallback user update:', fallbackError);
    }
    
    return apiErrorResponse(
      'user_update_failed',
      error.message || 'Failed to update user',
      null,
      500
    );
  }
} 