import { NextRequest } from 'next/server';
import { apiResponse, apiErrorResponse } from '@/app/lib/utils/apiHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';

// Get notifications for a user
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return apiErrorResponse(
        'unauthorized',
        'You must be logged in to access notifications',
        null,
        401
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const unreadOnly = searchParams.get('unread') === 'true';
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Build query
    const query: any = { userId: authUser.id };
    
    if (unreadOnly) {
      query.read = false;
    }
    
    // Get total count for pagination
    const totalCount = await db.collection('notifications').countDocuments(query);
    
    // Get notifications with pagination
    const notifications = await db.collection('notifications')
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    
    // Get unread count
    const unreadCount = await db.collection('notifications').countDocuments({
      userId: authUser.id,
      read: false
    });
    
    return apiResponse({
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      },
      unreadCount
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
}

// Create a new notification
export async function POST(request: NextRequest) {
  try {
    // This endpoint is for internal use only, but still requires authentication
    // In a real app, you might want to restrict this to admin/system users
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return apiErrorResponse(
        'unauthorized',
        'You must be logged in to create notifications',
        null,
        401
      );
    }
    
    const { userId, title, message, type, link, data } = await request.json();
    
    if (!userId || !title || !message) {
      return apiErrorResponse(
        'missing_parameters',
        'userId, title, and message are required',
        null,
        400
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Create notification
    const notification = {
      userId,
      title,
      message,
      type: type || 'info',
      link: link || null,
      data: data || null,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('notifications').insertOne(notification);
    
    // TODO: In a real app, you might want to trigger a real-time notification
    // using WebSockets or similar technology
    
    return apiResponse({
      success: true,
      notification: { ...notification, _id: result.insertedId }
    });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return apiErrorResponse(
        'unauthorized',
        'You must be logged in to update notifications',
        null,
        401
      );
    }
    
    const { notificationIds, markAll, read = true } = await request.json();
    
    if (!notificationIds && !markAll) {
      return apiErrorResponse(
        'missing_parameters',
        'notificationIds or markAll parameter is required',
        null,
        400
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    let result;
    
    if (markAll) {
      // Mark all notifications as read
      result = await db.collection('notifications').updateMany(
        { userId: authUser.id },
        { $set: { read, updatedAt: new Date() } }
      );
    } else {
      // Mark specific notifications as read
      const objectIds = notificationIds.map((id: string) => new ObjectId(id));
      
      result = await db.collection('notifications').updateMany(
        { _id: { $in: objectIds }, userId: authUser.id },
        { $set: { read, updatedAt: new Date() } }
      );
    }
    
    return apiResponse({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    console.error('Error updating notifications:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
}

// Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return apiErrorResponse(
        'unauthorized',
        'You must be logged in to delete notifications',
        null,
        401
      );
    }
    
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';
    
    if (!notificationId && !deleteAll) {
      return apiErrorResponse(
        'missing_parameters',
        'id or all parameter is required',
        null,
        400
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    let result;
    
    if (deleteAll) {
      // Delete all notifications for the user
      result = await db.collection('notifications').deleteMany({ userId: authUser.id });
    } else {
      // Delete a specific notification
      result = await db.collection('notifications').deleteOne({
        _id: new ObjectId(notificationId),
        userId: authUser.id
      });
      
      if (result.deletedCount === 0) {
        return apiErrorResponse(
          'not_found',
          'Notification not found or you do not have permission to delete it',
          null,
          404
        );
      }
    }
    
    return apiResponse({
      success: true,
      deletedCount: result.deletedCount
    });
  } catch (error: any) {
    console.error('Error deleting notifications:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
} 