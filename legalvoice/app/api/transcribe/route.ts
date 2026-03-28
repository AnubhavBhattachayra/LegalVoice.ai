import { NextResponse } from 'next/server';
import { SpeechClient } from '@google-cloud/speech';
import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud clients
const speechClient = new SpeechClient({
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || '{}')
});

const storage = new Storage({
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || '{}')
});

// Language code mapping for supported languages
const LANGUAGE_CODES: Record<string, string> = {
  'en': 'en-IN',
  'hi': 'hi-IN',
  'bn': 'bn-IN',
  'ta': 'ta-IN',
  'te': 'te-IN',
  'mr': 'mr-IN',
  'gu': 'gu-IN',
  'kn': 'kn-IN',
  'ml': 'ml-IN'
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob;
    const language = formData.get('language') as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert Blob to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Google Cloud Storage
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET || '';
    const fileName = `transcriptions/${Date.now()}-${Math.random().toString(36).substring(7)}.wav`;
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: {
        contentType: 'audio/wav'
      }
    });

    // Configure transcription request
    const audio = {
      uri: `gs://${bucketName}/${fileName}`
    };

    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: LANGUAGE_CODES[language] || 'en-IN',
      enableAutomaticPunctuation: true,
      model: 'latest_long',
      useEnhanced: true,
      enableWordTimeOffsets: true,
      enableWordConfidence: true,
      enableSpeakerDiarization: true,
      diarizationSpeakerCount: 1
    };

    const request = {
      audio: audio,
      config: config
    };

    // Perform the transcription
    const [operation] = await speechClient.longRunningRecognize(request);
    const [response] = await operation.promise();

    // Process the transcription results
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    // Clean up the uploaded file
    await file.delete();

    // Use Gemini API to enhance the transcription
    const enhancedTranscription = await enhanceTranscription(transcription, language);

    return NextResponse.json({
      text: enhancedTranscription,
      confidence: response.results[0].alternatives[0].confidence,
      language: language
    });
  } catch (error) {
    console.error('Error in transcription:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

async function enhanceTranscription(text: string, language: string): Promise<string> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Please enhance the following transcribed text. 
    Fix any grammatical errors, improve clarity, and ensure proper legal terminology.
    Maintain the original meaning while making it more professional and accurate.
    If the text is in a regional language, ensure it follows proper legal language conventions.
    
    Original text: ${text}
    Language: ${language}
    
    Enhanced text:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error enhancing transcription:', error);
    return text; // Return original text if enhancement fails
  }
} 