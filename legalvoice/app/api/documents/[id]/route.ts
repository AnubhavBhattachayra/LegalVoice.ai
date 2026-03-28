import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';
import { apiResponse, apiErrorResponse } from '@/app/lib/utils/apiHelpers';
import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';

interface Params {
  id: string;
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = params;
    
    // Check authentication
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return apiErrorResponse(
        'unauthorized',
        'You must be logged in to access documents',
        null,
        401
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Get document
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: authUser.id }, // User owns the document
        { isPublic: true }, // Document is public
        { sharedWith: { $elemMatch: { userId: authUser.id } } } // Document is shared with user
      ]
    });
    
    if (!document) {
      return apiErrorResponse(
        'not_found',
        'Document not found or access denied',
        null,
        404
      );
    }
    
    return apiResponse({ document });
  } catch (error: any) {
    console.error('Error fetching document:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = params;
    
    // Check authentication
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return apiErrorResponse(
        'unauthorized',
        'You must be logged in to update documents',
        null,
        401
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Check if document exists and user has permission
    const existingDocument = await db.collection('documents').findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: authUser.id }, // User owns the document
        { sharedWith: { $elemMatch: { userId: authUser.id, permissions: { $in: ['edit'] } } } } // User has edit permission
      ]
    });
    
    if (!existingDocument) {
      return apiErrorResponse(
        'not_found',
        'Document not found or you do not have permission to update it',
        null,
        404
      );
    }
    
    // Process tags if provided
    const tags = body.tags
      ? (Array.isArray(body.tags) 
          ? body.tags 
          : body.tags.split(',').map((tag: string) => tag.trim()))
      : existingDocument.tags;
    
    // Update document
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Only update provided fields
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.folderId !== undefined) {
      updateData.folderId = body.folderId ? new ObjectId(body.folderId) : null;
    }
    if (body.tags !== undefined) updateData.tags = tags;
    if (body.sharedWith !== undefined) updateData.sharedWith = body.sharedWith;
    
    const result = await db.collection('documents').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return apiErrorResponse(
        'not_found',
        'Document not found',
        null,
        404
      );
    }
    
    const updatedDocument = await db.collection('documents').findOne({
      _id: new ObjectId(id)
    });
    
    return apiResponse({
      message: 'Document updated successfully',
      document: updatedDocument
    });
  } catch (error: any) {
    console.error('Error updating document:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = params;
    
    // Check authentication
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return apiErrorResponse(
        'unauthorized',
        'You must be logged in to delete documents',
        null,
        401
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Check if document exists and user has permission
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(id),
      userId: authUser.id // Only the owner can delete
    });
    
    if (!document) {
      return apiErrorResponse(
        'not_found',
        'Document not found or you do not have permission to delete it',
        null,
        404
      );
    }
    
    // Delete file from disk if it exists
    if (document.filePath) {
      try {
        const filePath = path.join(process.cwd(), document.filePath);
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error('Error deleting file from disk:', fileError);
        // Continue with document deletion even if file deletion fails
      }
    }
    
    // Delete document from database
    const result = await db.collection('documents').deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return apiErrorResponse(
        'deletion_failed',
        'Failed to delete document',
        null,
        500
      );
    }
    
    return apiResponse({
      message: 'Document deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
} 