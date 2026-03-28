import { NextRequest } from 'next/server';
import { apiResponse, apiErrorResponse } from '@/app/lib/utils/apiHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_FILE_TYPES = [
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/rtf',
  'application/json'
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return apiErrorResponse(
        'unauthorized',
        'You must be logged in to upload files',
        null,
        401
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || file.name;
    const description = formData.get('description') as string || '';
    const tags = formData.get('tags') as string || '';
    const folderId = formData.get('folderId') as string || null;
    
    if (!file) {
      return apiErrorResponse(
        'missing_file',
        'No file was provided',
        null,
        400
      );
    }
    
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return apiErrorResponse(
        'invalid_file_type',
        'File type not allowed',
        null,
        400
      );
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return apiErrorResponse(
        'file_too_large',
        `File size exceeds the maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        null,
        400
      );
    }
    
    // Create a unique filename
    const fileExtension = extname(file.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', authUser.id);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Save file to disk
    const filePath = join(uploadDir, fileName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);
    
    // Process tags
    const tagArray = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Save file metadata to database
    const document = {
      userId: authUser.id,
      title,
      description,
      originalName: file.name,
      fileName,
      filePath: filePath.replace(process.cwd(), ''),
      fileType: file.type,
      fileSize: file.size,
      tags: tagArray,
      folderId: folderId ? new ObjectId(folderId) : null,
      isPublic: false,
      sharedWith: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('documents').insertOne(document);
    
    // Create a notification for the user
    await db.collection('notifications').insertOne({
      userId: authUser.id,
      title: 'File Uploaded',
      message: `Your file "${title}" has been uploaded successfully.`,
      type: 'success',
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return apiResponse({
      message: 'File uploaded successfully',
      document: {
        ...document,
        _id: result.insertedId
      }
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
} 