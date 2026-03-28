import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { PATENT_SECTIONS } from '@/app/lib/utils/geminiClient';

/**
 * POST /api/ai-drafting/start-session
 * Creates a new AI drafting session
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from auth
    let user = null;
    try {
      user = await getUserFromRequest(request);
    } catch (error) {
      console.warn('Authentication failed for AI drafting:', error);
      return NextResponse.json({ 
        error: 'Authentication required to start AI drafting' 
      }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required to start AI drafting' 
      }, { status: 401 });
    }
    
    // Get request body
    const { document_type = 'general', initial_message = '' } = await request.json();
    
    // Connect to the database
    const { db, error: dbError } = await connectToDatabase();
    
    if (dbError || !db) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json({
        error: 'Database connection failed',
        details: 'Unable to connect to the database. Please try again later.'
      }, { status: 503 });
    }
    
    // Initialize metadata based on document type
    const metadata = {};
    
    // Create initial conversation history
    let conversation_history = [];
    
    // Handle different document types
    if (document_type === 'patent-application') {
      // Add initial system message for patent application
      conversation_history.push({
        role: 'system',
        content: `You are a patent drafting assistant. You are helping the user create a patent application. 
        
        Guide the user through each section of the patent application:
        ${PATENT_SECTIONS.map(s => `- ${s.name}: ${s.description}`).join('\n')}
        
        Ask targeted questions to help the user provide all necessary information for each section. Move through the sections in order.`
      });
      
      // Add initial assistant message for patent
      conversation_history.push({
        role: 'assistant',
        content: `Welcome to the Patent Application Assistant! I'll guide you step-by-step through creating your patent application.

A complete patent application typically includes these sections:
- Title
- Field of Invention
- Background
- Summary
- Detailed Description
- Claims
- Abstract

Let's start with the Title section. What's your invention called? Please provide a brief, technical title that accurately describes your innovation (15 words or less).`
      });
      
      // Initialize patent progress in metadata
      metadata.patentProgress = {
        completedSections: [],
        currentSection: 'title',
        progress: 0
      };
    } else {
      // Default system message for other document types
      conversation_history.push({
        role: 'system',
        content: `You are a legal document drafting assistant. You are helping the user create a ${document_type} document.`
      });
      
      // Default assistant message
      conversation_history.push({
        role: 'assistant',
        content: `I'll help you create your ${document_type}. Let's gather the information we need. What would you like to include in this document?`
      });
    }
    
    // Add initial user message if provided
    if (initial_message.trim()) {
      conversation_history.push({
        role: 'user',
        content: initial_message
      });
      
      // Add a response to the initial message
      if (document_type === 'patent-application') {
        conversation_history.push({
          role: 'assistant',
          content: `Thank you for providing that initial information about your invention. I'll help you develop a comprehensive patent application. 

Let's continue with the Title section. Remember that a good patent title should be:
- Brief but technically accurate
- Free from fancy expressions or ambiguity
- Precise and definite
- 15 words or less

Based on what you've told me, can you provide a concise technical title for your invention?`
        });
      } else {
        conversation_history.push({
          role: 'assistant',
          content: `Thank you for providing that information about your ${document_type}. Let's continue to build out the document. Could you tell me more about the specific requirements or any key points you'd like to emphasize?`
        });
      }
    }
    
    // Create new drafting session
    const now = new Date();
    const session = {
      userId: user.uid,
      document_type,
      status: 'in_progress',
      created_at: now,
      updated_at: now,
      conversation_history,
      metadata
    };
    
    // Ensure the draftingSessions collection exists
    try {
      await db.createCollection('draftingSessions');
      console.log('Created draftingSessions collection');
    } catch (err) {
      // Collection likely already exists, which is fine
      console.log('draftingSessions collection already exists');
    }
    
    // Insert the new session
    const result = await db.collection('draftingSessions').insertOne(session);
    
    // Return success with session data
    return NextResponse.json({
      _id: result.insertedId.toString(),
      document_type,
      status: 'in_progress',
      created_at: now,
      updated_at: now,
      conversation_history,
      metadata
    });
    
  } catch (error: any) {
    console.error('Error starting drafting session:', error);
    return NextResponse.json({
      error: 'Failed to start drafting session',
      details: error.message
    }, { status: 500 });
  }
} 