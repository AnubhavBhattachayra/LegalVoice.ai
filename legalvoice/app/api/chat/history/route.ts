import { NextRequest } from 'next/server';
import { apiResponse, apiErrorResponse } from '@/app/lib/utils/apiHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';

// Get chat history for a user
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return apiErrorResponse(
        'unauthorized',
        'You must be logged in to access chat history',
        null,
        401
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Get chat ID if requesting a specific chat
    const chatId = searchParams.get('chatId');
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    if (chatId) {
      // Get a specific chat with its messages
      const chat = await db.collection('chats').findOne({
        _id: new ObjectId(chatId),
        userId: authUser.id
      });
      
      if (!chat) {
        return apiErrorResponse(
          'not_found',
          'Chat not found or you do not have permission to access it',
          null,
          404
        );
      }
      
      // Get messages for this chat
      const messages = await db.collection('chatMessages')
        .find({ chatId: chat._id.toString() })
        .sort({ timestamp: 1 })
        .toArray();
      
      return apiResponse({
        chat: {
          ...chat,
          messages
        }
      });
    } else {
      // Get all chats for the user (without messages)
      const chats = await db.collection('chats')
        .find({ userId: authUser.id })
        .sort({ updatedAt: -1 })
        .toArray();
      
      return apiResponse({ chats });
    }
  } catch (error: any) {
    console.error('Error fetching chat history:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
}

// Create a new chat or save messages to existing chat
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return apiErrorResponse(
        'unauthorized',
        'You must be logged in to save chat history',
        null,
        401
      );
    }
    
    const { chatId, title, messages, documentId, documentContext } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return apiErrorResponse(
        'invalid_data',
        'Messages are required and must be an array',
        null,
        400
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    let chat;
    
    if (chatId) {
      // Update existing chat
      chat = await db.collection('chats').findOne({
        _id: new ObjectId(chatId),
        userId: authUser.id
      });
      
      if (!chat) {
        return apiErrorResponse(
          'not_found',
          'Chat not found or you do not have permission to access it',
          null,
          404
        );
      }
      
      // Update chat metadata
      await db.collection('chats').updateOne(
        { _id: chat._id },
        { 
          $set: { 
            updatedAt: new Date(),
            lastMessage: messages[messages.length - 1].content.substring(0, 100)
          } 
        }
      );
    } else {
      // Create new chat
      const now = new Date();
      
      const newChat = {
        userId: authUser.id,
        title: title || 'New Chat',
        createdAt: now,
        updatedAt: now,
        lastMessage: messages[messages.length - 1].content.substring(0, 100),
        documentId: documentId || null,
        documentContext: documentContext || null
      };
      
      const result = await db.collection('chats').insertOne(newChat);
      chat = { ...newChat, _id: result.insertedId };
    }
    
    // Save messages
    const messagesToSave = messages.map(message => ({
      chatId: chat._id.toString(),
      userId: authUser.id,
      role: message.role,
      content: message.content,
      timestamp: new Date(message.timestamp) || new Date()
    }));
    
    // Clear existing messages if necessary and insert new ones
    if (chatId) {
      await db.collection('chatMessages').deleteMany({ chatId });
    }
    
    await db.collection('chatMessages').insertMany(messagesToSave);
    
    return apiResponse({
      success: true,
      chatId: chat._id.toString()
    });
  } catch (error: any) {
    console.error('Error saving chat history:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
}

// Delete a chat
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return apiErrorResponse(
        'unauthorized',
        'You must be logged in to delete chat history',
        null,
        401
      );
    }
    
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    
    if (!chatId) {
      return apiErrorResponse(
        'missing_chat_id',
        'Chat ID is required',
        null,
        400
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Verify ownership
    const chat = await db.collection('chats').findOne({
      _id: new ObjectId(chatId),
      userId: authUser.id
    });
    
    if (!chat) {
      return apiErrorResponse(
        'not_found',
        'Chat not found or you do not have permission to access it',
        null,
        404
      );
    }
    
    // Delete the chat and its messages
    await db.collection('chats').deleteOne({ _id: chat._id });
    await db.collection('chatMessages').deleteMany({ chatId });
    
    return apiResponse({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting chat:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
} 