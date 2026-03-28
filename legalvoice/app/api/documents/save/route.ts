import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';

export async function POST(req: NextRequest) {
  try {
    // Get user from auth - required for saving documents
    let user = null;
    try {
      user = await getUserFromRequest(req);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'You must be logged in to save documents' 
      }, { status: 401 });
    }

    // Get request data
    const { title, content, documentType, metadata } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title and content are required' 
      }, { status: 400 });
    }

    try {
      const { db } = await connectToDatabase();
      
      // Save the document to the database
      const now = new Date();
      const document = {
        userId: user.id,
        title,
        content,
        documentType: documentType || 'other',
        metadata: metadata || {},
        createdAt: now,
        updatedAt: now
      };
      
      const result = await db.collection('documents').insertOne(document);
      
      return NextResponse.json({
        success: true,
        documentId: result.insertedId.toString(),
        document: {
          ...document,
          _id: result.insertedId
        }
      });
    } catch (dbError) {
      console.error('Error saving document to database:', dbError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save document to database' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in document save API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 