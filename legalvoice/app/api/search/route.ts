import { NextRequest } from 'next/server';
import { apiResponse, apiErrorResponse } from '@/app/lib/utils/apiHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';
import { ObjectId } from 'mongodb';

// Search endpoint
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return apiErrorResponse(
        'unauthorized',
        'You must be logged in to use search',
        null,
        401
      );
    }
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    if (!query) {
      return apiErrorResponse(
        'missing_query',
        'Search query is required',
        null,
        400
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Prepare aggregation pipeline for search
    let searchResults: any = {};
    let totalResults = 0;
    
    // Create text index for collections if they don't exist
    // This would normally be done in a database migration script
    try {
      await db.collection('documents').createIndex({ title: 'text', content: 'text', tags: 'text' });
      await db.collection('chats').createIndex({ title: 'text', lastMessage: 'text' });
      await db.collection('chatMessages').createIndex({ content: 'text' });
    } catch (error) {
      console.log('Indexes may already exist:', error);
    }
    
    // Define search regex pattern for more flexible search
    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
    // Get user documents for access control
    const userDocuments = type === 'all' || type === 'documents' ? 
      await db.collection('documents')
        .find({ 
          $or: [
            { userId: authUser.id },
            { sharedWith: authUser.id },
            { isPublic: true }
          ],
          $or: [
            { title: { $regex: searchRegex } },
            { content: { $regex: searchRegex } },
            { tags: { $regex: searchRegex } }
          ]
        })
        .project({ title: 1, description: 1, createdAt: 1, updatedAt: 1, type: 1, size: 1 })
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray() : [];
        
    totalResults += userDocuments.length;
    
    // Get user chats
    const userChats = type === 'all' || type === 'chats' ? 
      await db.collection('chats')
        .find({ 
          userId: authUser.id,
          $or: [
            { title: { $regex: searchRegex } },
            { lastMessage: { $regex: searchRegex } }
          ]
        })
        .project({ title: 1, lastMessage: 1, createdAt: 1, updatedAt: 1 })
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray() : [];
        
    totalResults += userChats.length;
    
    // Get chat messages (with chat data joined)
    const chatMessages = type === 'all' || type === 'messages' ? 
      await db.collection('chatMessages')
        .aggregate([
          { 
            $match: { 
              content: { $regex: searchRegex },
              userId: authUser.id
            } 
          },
          { 
            $lookup: {
              from: 'chats',
              localField: 'chatId',
              foreignField: '_id',
              as: 'chat'
            }
          },
          { $unwind: '$chat' },
          { $sort: { 'timestamp': -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { 
            $project: { 
              content: 1, 
              role: 1,
              timestamp: 1,
              'chat.title': 1,
              'chat._id': 1
            } 
          }
        ]).toArray() : [];
        
    totalResults += chatMessages.length;
    
    // Format results
    searchResults = {
      documents: userDocuments.map(doc => ({
        ...doc,
        resultType: 'document'
      })),
      chats: userChats.map(chat => ({
        ...chat,
        resultType: 'chat'
      })),
      messages: chatMessages.map(msg => ({
        ...msg,
        resultType: 'message'
      }))
    };
    
    // Get total count for pagination
    const totalCount = await Promise.all([
      type === 'all' || type === 'documents' ? 
        db.collection('documents').countDocuments({ 
          $or: [
            { userId: authUser.id },
            { sharedWith: authUser.id },
            { isPublic: true }
          ],
          $or: [
            { title: { $regex: searchRegex } },
            { content: { $regex: searchRegex } },
            { tags: { $regex: searchRegex } }
          ]
        }) : 0,
      type === 'all' || type === 'chats' ?
        db.collection('chats').countDocuments({ 
          userId: authUser.id,
          $or: [
            { title: { $regex: searchRegex } },
            { lastMessage: { $regex: searchRegex } }
          ]
        }) : 0,
      type === 'all' || type === 'messages' ?
        db.collection('chatMessages').countDocuments({ 
          content: { $regex: searchRegex },
          userId: authUser.id
        }) : 0
    ]);
    
    const totalDocuments = totalCount[0];
    const totalChats = totalCount[1];
    const totalMessages = totalCount[2];
    const grandTotal = totalDocuments + totalChats + totalMessages;
    
    // Combine results if searching for all types
    let combinedResults = [];
    if (type === 'all') {
      combinedResults = [
        ...searchResults.documents,
        ...searchResults.chats,
        ...searchResults.messages
      ].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.timestamp);
        const dateB = new Date(b.updatedAt || b.timestamp);
        return dateB.getTime() - dateA.getTime();
      }).slice(0, limit);
    }
    
    return apiResponse({
      results: type === 'all' ? combinedResults : searchResults[`${type}`] || [],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(grandTotal / limit),
        totalCount: grandTotal,
        limit
      },
      counts: {
        documents: totalDocuments,
        chats: totalChats,
        messages: totalMessages
      },
      query
    });
  } catch (error: any) {
    console.error('Error searching:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
} 