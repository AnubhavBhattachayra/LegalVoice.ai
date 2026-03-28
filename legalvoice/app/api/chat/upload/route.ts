import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { mkdir } from 'fs/promises';

// Initialize Gemini API with the key set in environment variables
const apiKey = process.env.GEMINI_API_KEY;

// Check if API key is available
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(req: NextRequest) {
  try {
    // Get user from auth (optional)
    let user = null;
    try {
      user = await getUserFromRequest(req);
    } catch (error) {
      console.warn('Authentication failed for file upload, proceeding in guest mode:', error);
      // Continue in guest mode - don't block upload functionality
    }

    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const sessionId = formData.get('sessionId') as string;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'File is too large (max 10MB)'
      }, { status: 400 });
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'File type not supported. Please upload JPEG, PNG, PDF, or TXT files'
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Generate a unique filename
    const fileName = `${uuidv4()}-${file.name}`;
    const filePath = join(uploadDir, fileName);
    
    // Save the file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    // Get the file as a byte array for the Gemini API
    const fileBytes = await fileBuffer;
    
    // Initialize the Gemini Vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-vision' });
    
    let result;
    try {
      // Process the file with Gemini
      const prompt = "Please analyze this file and provide a detailed summary. If it's a legal document, identify its type, key provisions, and any important legal terminology.";
      
      // Create the content parts
      const imageParts = [
        {text: prompt},
        {
          inlineData: {
            data: fileBytes.toString('base64'),
            mimeType: file.type
          }
        }
      ];
      
      result = await model.generateContent({
        contents: [{ role: "user", parts: imageParts }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });
      
    } catch (genaiError) {
      console.error('Error processing with Gemini:', genaiError);
      return NextResponse.json({
        success: false,
        error: 'Failed to process the file with our AI. Please try another file or a text query instead.'
      }, { status: 500 });
    }

    const response = await result.response;
    const analysis = response.text();
    
    // Save to database if user is authenticated
    let attachmentId = null;
    if (user) {
      try {
        const { db } = await connectToDatabase();
        const now = new Date();
        
        // Save file attachment
        const attachment = {
          userId: user.id,
          fileName: file.name,
          filePath: filePath,
          fileType: file.type,
          fileSize: file.size,
          analysis: analysis,
          createdAt: now
        };
        
        const attachmentResult = await db.collection('chatAttachments').insertOne(attachment);
        attachmentId = attachmentResult.insertedId.toString();
        
        // If a session is provided, update or create it
        if (sessionId) {
          // Update existing session with file info
          await db.collection('chatSessions').updateOne(
            { _id: new ObjectId(sessionId), userId: user.id },
            { 
              $set: { 
                updatedAt: now,
                lastMessage: `Uploaded file: ${file.name}`
              }
            }
          );
          
          // Add file upload message to chat history
          await db.collection('chatMessages').insertOne({
            sessionId: sessionId,
            userId: user.id,
            role: 'user',
            content: `[File uploaded: ${file.name}]`,
            attachmentId: attachmentId,
            createdAt: now
          });
          
          // Add AI analysis as a message
          await db.collection('chatMessages').insertOne({
            sessionId: sessionId,
            userId: user.id,
            role: 'assistant',
            content: analysis,
            createdAt: now
          });
        }
      } catch (dbError) {
        console.error('Error saving to database:', dbError);
        // Continue execution even if database save fails
      }
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      analysis: analysis,
      attachmentId: attachmentId
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to upload and process the file'
    }, { status: 500 });
  }
} 