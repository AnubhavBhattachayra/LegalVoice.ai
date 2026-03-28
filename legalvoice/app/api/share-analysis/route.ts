import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/app/utils/mongodb';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysisId, userId } = await req.json();
    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get the analysis document
    const analysis = await db.collection('document_analyses').findOne({
      _id: new ObjectId(analysisId),
      userId: userId
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Generate a unique share token
    const shareToken = generateShareToken();

    // Store the share token in the database
    await db.collection('share_tokens').insertOne({
      token: shareToken,
      analysisId: new ObjectId(analysisId),
      userId: userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
    });

    // Generate share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/analysis?token=${shareToken}`;

    return NextResponse.json({ shareUrl });
  } catch (error) {
    console.error('Share analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to share analysis' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get the share token document
    const shareToken = await db.collection('share_tokens').findOne({
      token: token,
      expiresAt: { $gt: new Date() }
    });

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Invalid or expired share token' },
        { status: 404 }
      );
    }

    // Get the analysis document
    const analysis = await db.collection('document_analyses').findOne({
      _id: shareToken.analysisId
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Get shared analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to get shared analysis' },
      { status: 500 }
    );
  }
}

function generateShareToken(): string {
  // Generate a random token using crypto
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
} 