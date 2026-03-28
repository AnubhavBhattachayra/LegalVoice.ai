import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkCreditsAvailable } from '@/app/utils/credits';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, documentId, userId } = await req.json();
    if (!question || !documentId) {
      return NextResponse.json(
        { error: 'Question and document ID are required' },
        { status: 400 }
      );
    }

    // Check if user has enough credits
    const hasCredits = await checkCreditsAvailable(userId, 2); // 2 credits per question
    if (!hasCredits) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Get document content and previous analysis
    const documentData = await getDocumentData(documentId);
    if (!documentData) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Generate answer using Gemini
    const questionPrompt = `Based on the following legal document and its analysis, please answer the question:

Document Content:
${documentData.content}

Previous Analysis:
${JSON.stringify(documentData.analysis, null, 2)}

Question: ${question}

Please provide a detailed answer that:
1. Directly addresses the question
2. References specific parts of the document when relevant
3. Includes any relevant legal implications
4. Provides confidence level in the answer

Format the response as JSON with the following structure:
{
  "answer": "string",
  "confidence": number,
  "references": ["string"],
  "legalImplications": ["string"]
}`;

    const result = await model.generateContent(questionPrompt);
    const response = await result.response;
    const answerData = JSON.parse(response.text());

    // Store question and answer in database
    await storeQuestionAnswer(userId, documentId, question, answerData);

    // Deduct credits
    await deductCredits(userId, 2);

    return NextResponse.json(answerData);
  } catch (error) {
    console.error('Document question error:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}

async function getDocumentData(documentId: string) {
  // Implement document data retrieval from database
  // This should return both the document content and previous analysis
  return {
    content: 'Document content to be implemented',
    analysis: {
      summary: 'Previous analysis to be implemented',
      keyPoints: [],
      legalImplications: [],
      recommendations: [],
      references: [],
      confidence: 0,
      documentType: '',
      extractedFields: {}
    }
  };
}

async function storeQuestionAnswer(
  userId: string,
  documentId: string,
  question: string,
  answerData: any
) {
  // Implement database storage for questions and answers
  // This could involve storing in MongoDB, PostgreSQL, etc.
}

async function deductCredits(userId: string, amount: number) {
  // Implement credit deduction logic
  // This should update the user's credit balance in the database
} 