import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';

// Initialize Gemini API with the key set in environment variables
const apiKey = process.env.GEMINI_API_KEY;

// Check if API key is available
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(req: NextRequest) {
  try {
    // Get user from auth (optional for this endpoint to allow guest document generation)
    let user = null;
    try {
      user = await getUserFromRequest(req);
    } catch (error) {
      console.warn('User not authenticated, proceeding in guest mode for document generation');
      // Continue in guest mode - document generation can be allowed for non-authenticated users
    }

    // Get request data
    const { documentType, fields, prompt, title } = await req.json();

    if (!documentType || (!fields && !prompt)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Document type and fields/prompt are required' 
      }, { status: 400 });
    }

    // Configure the model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.1, // Lower temperature for more predictable legal text
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 8192, // Use high token limit for full document generation
      },
    });

    // Create the prompt for document generation
    let generationPrompt = '';
    
    if (prompt) {
      // Use the provided prompt directly if available
      generationPrompt = prompt;
    } else {
      // Create a prompt based on the document type and fields
      generationPrompt = `
      You are a legal document assistant that creates professional legal documents.
      I need you to create a ${documentType.replace(/_/g, ' ')} document with the following details:
      
      ${Object.entries(fields)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')}
      
      Please provide a complete, professionally formatted document that:
      1. Follows all standard legal conventions and structure for this document type
      2. Includes all necessary clauses and legal language
      3. Incorporates all the provided information appropriately
      4. Is ready to be used with minimal editing
      5. Formats the document in a clean, easy-to-read layout
      
      The document should be comprehensive and include all sections that would typically be found in this type of legal document.
      `;
    }

    // Generate the document
    try {
      const result = await model.generateContent(generationPrompt);
      const response = await result.response;
      let documentText = response.text();
      
      // Clean the document text to remove code blocks if any
      documentText = documentText.replace(/```(.*?)```/gs, '$1');
      
      // Remove markdown formatting if any
      documentText = documentText.replace(/\*\*(.*?)\*\*/g, '$1');
      documentText = documentText.replace(/\*(.*?)\*/g, '$1');
      
      return NextResponse.json({
        success: true,
        document: documentText,
        title: title || `${documentType.replace(/_/g, ' ')} - ${new Date().toLocaleDateString()}`
      });
    } catch (aiError) {
      console.error('Error generating document with AI:', aiError);
      return NextResponse.json({
        success: false,
        error: 'Failed to generate the document. Please try again with more details.'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in document generation API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 