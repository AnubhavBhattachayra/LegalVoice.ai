import { NextResponse } from 'next/server';
import { Translate } from '@google-cloud/translate/build/src/v2';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Cloud Translation client
const translate = new Translate({
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || '{}')
});

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Language code mapping for supported languages
const LANGUAGE_CODES: Record<string, string> = {
  'en': 'en',
  'hi': 'hi',
  'bn': 'bn',
  'ta': 'ta',
  'te': 'te',
  'mr': 'mr',
  'gu': 'gu',
  'kn': 'kn',
  'ml': 'ml'
};

export async function POST(req: Request) {
  try {
    const { text, sourceLanguage, targetLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // First, translate using Google Cloud Translation API
    const [translation] = await translate.translate(text, {
      from: sourceLanguage || 'auto',
      to: targetLanguage
    });

    // Then, enhance the translation using Gemini API
    const enhancedTranslation = await enhanceTranslation(
      translation as string,
      sourceLanguage || 'en',
      targetLanguage
    );

    return NextResponse.json({
      text: enhancedTranslation,
      sourceLanguage: sourceLanguage || 'auto',
      targetLanguage
    });
  } catch (error) {
    console.error('Error in translation:', error);
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    );
  }
}

async function enhanceTranslation(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Please enhance the following translated legal text.
    Ensure it uses proper legal terminology and follows the conventions of legal language in the target language.
    Maintain the original meaning while making it more professional and accurate.
    
    Original text: ${text}
    Source language: ${sourceLanguage}
    Target language: ${targetLanguage}
    
    Enhanced translation:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error enhancing translation:', error);
    return text; // Return original translation if enhancement fails
  }
}

// Helper function to detect language
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    const [detection] = await translate.detect(text);
    const detectedLanguage = detection.language;

    return NextResponse.json({
      detectedLanguage,
      confidence: detection.confidence
    });
  } catch (error) {
    console.error('Error in language detection:', error);
    return NextResponse.json(
      { error: 'Failed to detect language' },
      { status: 500 }
    );
  }
} 