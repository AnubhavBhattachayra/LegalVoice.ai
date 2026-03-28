import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/app/utils/mongodb';
import { ObjectId } from 'mongodb';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = extname(file.name);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Store file metadata in MongoDB
    const fileMetadata = {
      userId: session.user.id,
      originalName: file.name,
      filename: uniqueFilename,
      contentType: file.type,
      size: file.size,
      uploadedAt: new Date(),
      status: 'processing'
    };

    const result = await db.collection('files').insertOne(fileMetadata);

    // Store file in GridFS
    const bucket = new mongodb.GridFSBucket(db);
    const uploadStream = bucket.openUploadStream(uniqueFilename, {
      metadata: fileMetadata
    });

    await new Promise((resolve, reject) => {
      uploadStream.on('error', reject);
      uploadStream.on('finish', resolve);
      uploadStream.end(buffer);
    });

    // Return file URL
    const fileUrl = `/api/files/${result.insertedId}`;

    return NextResponse.json({ fileUrl });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get file metadata
    const fileMetadata = await db.collection('files').findOne({
      _id: new ObjectId(fileId),
      userId: session.user.id
    });

    if (!fileMetadata) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Get file from GridFS
    const bucket = new mongodb.GridFSBucket(db);
    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of downloadStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': fileMetadata.contentType,
        'Content-Disposition': `attachment; filename="${fileMetadata.originalName}"`,
        'Content-Length': fileMetadata.size.toString()
      }
    });
  } catch (error) {
    console.error('File download error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Delete file metadata
    const result = await db.collection('files').deleteOne({
      _id: new ObjectId(fileId),
      userId: session.user.id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete file from GridFS
    const bucket = new mongodb.GridFSBucket(db);
    await bucket.delete(new ObjectId(fileId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
} 