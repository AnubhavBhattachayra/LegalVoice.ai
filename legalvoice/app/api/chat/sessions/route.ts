import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/chat/sessions
 * Fetches chat session history for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from auth (optional)
    let user = null;
    try {
      user = await getUserFromRequest(request);
    } catch (error) {
      console.warn('Authentication failed for sessions API:', error);
      // Return empty sessions for guests
      return NextResponse.json({
        success: true,
        data: {
          sessions: []
        }
      });
    }
    
    // If no user is authenticated, return empty sessions
    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          sessions: []
        }
      });
    }
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Fetch user's chat sessions
    const sessions = await db.collection('chatSessions')
      .find({ userId: user.uid })
      .sort({ updatedAt: -1 })
      .limit(20)
      .toArray();
    
    // Return sessions to client
    return NextResponse.json({
      success: true,
      data: {
        sessions: sessions.map(session => ({
          id: session._id.toString(),
          title: session.title || 'New Chat',
          date: session.createdAt,
          preview: session.lastMessage || 'New conversation',
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch chat sessions'
    }, { status: 500 });
  }
}

/**
 * POST /api/chat/sessions
 * Creates a new chat session
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from auth
    let user = null;
    try {
      user = await getUserFromRequest(request);
    } catch (error) {
      console.warn('Authentication failed for session creation:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required to create saved sessions' 
      }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required to create saved sessions' 
      }, { status: 401 });
    }
    
    const { title = 'New Conversation' } = await request.json();
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Create new session
    const now = new Date();
    const session = {
      userId: user.uid,
      title,
      createdAt: now,
      updatedAt: now,
      lastMessage: null
    };
    
    const result = await db.collection('chatSessions').insertOne(session);
    
    return NextResponse.json({
      success: true,
      data: {
        sessionId: result.insertedId.toString()
      }
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create chat session'
    }, { status: 500 });
  }
} 