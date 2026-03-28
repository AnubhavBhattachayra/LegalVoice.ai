import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';
import { apiErrorResponse } from '@/app/lib/utils/apiHelpers';
import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

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
        'You must be logged in to download documents',
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
    
    // Check if the document has a file path
    if (!document.filePath) {
      return apiErrorResponse(
        'no_file',
        'This document does not have an associated file',
        null,
        400
      );
    }
    
    // Get the full file path
    const filePath = path.join(process.cwd(), document.filePath);
    
    // Check if file exists
    if (!existsSync(filePath)) {
      return apiErrorResponse(
        'file_not_found',
        'The file associated with this document could not be found',
        null,
        404
      );
    }
    
    // Read file
    const fileBuffer = await fs.readFile(filePath);
    
    // Create response with file
    const response = new NextResponse(fileBuffer);
    
    // Set appropriate headers
    response.headers.set('Content-Type', document.fileType || 'application/octet-stream');
    response.headers.set('Content-Disposition', `attachment; filename="${document.originalName || document.fileName}"`);
    
    // Record download activity
    try {
      await db.collection('activities').insertOne({
        userId: authUser.id,
        documentId: document._id,
        activityType: 'download',
        createdAt: new Date()
      });
    } catch (activityError) {
      console.error('Error recording download activity:', activityError);
      // Continue with download even if activity logging fails
    }
    
    return response;
  } catch (error: any) {
    console.error('Error downloading document:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
} 