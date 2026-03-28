import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/chat/sessions/[id]
 * Fetches a specific chat session with its messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    if (!sessionId || !ObjectId.isValid(sessionId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session ID'
      }, { status: 400 });
    }
    
    // Get user from auth
    let user = null;
    try {
      user = await getUserFromRequest(request);
    } catch (error) {
      console.warn('Authentication failed for session detail:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required to access saved sessions' 
      }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required to access saved sessions' 
      }, { status: 401 });
    }
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Find the session
    const session = await db.collection('chatSessions').findOne({
      _id: new ObjectId(sessionId),
      userId: user.uid
    });
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 });
    }
    
    // Get the messages for this session
    const messages = await db.collection('chatMessages')
      .find({ sessionId })
      .sort({ createdAt: 1 })
      .toArray();
    
    return NextResponse.json({
      success: true,
      messages: messages.map(msg => ({
        _id: msg._id.toString(),
        sender: msg.sender,
        message: msg.message,
        createdAt: msg.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch chat session'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/chat/sessions/[id]
 * Deletes a chat session and its messages
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    if (!sessionId || !ObjectId.isValid(sessionId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session ID'
      }, { status: 400 });
    }
    
    // Get user from auth
    let user = null;
    try {
      user = await getUserFromRequest(request);
    } catch (error) {
      console.warn('Authentication failed for session deletion:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required to delete saved sessions' 
      }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required to delete saved sessions' 
      }, { status: 401 });
    }
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Ensure the session belongs to the user
    const session = await db.collection('chatSessions').findOne({
      _id: new ObjectId(sessionId),
      userId: user.uid
    });
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 });
    }
    
    // Delete the session and its messages
    await db.collection('chatSessions').deleteOne({ _id: new ObjectId(sessionId) });
    await db.collection('chatMessages').deleteMany({ sessionId });
    
    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete chat session'
    }, { status: 500 });
  }
} 