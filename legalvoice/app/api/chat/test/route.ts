import { NextResponse } from 'next/server';
import {
  extractDocumentType,
  extractFormFields,
  extractLegalTopic,
  extractReferences,
  calculateConfidence,
  extractSource,
  cleanText
} from '@/app/utils/metadataExtractors';

export async function GET() {
  // Test the imported functions
  const sampleText = "This is a test about a will document for inheritance purposes. The legal topic is family law.";
  
  const documentType = extractDocumentType(sampleText);
  const legalTopic = extractLegalTopic(sampleText);
  const cleanedText = cleanText(sampleText);
  
  return NextResponse.json({
    success: true,
    results: {
      documentType,
      legalTopic,
      cleanedText,
      confidence: calculateConfidence(sampleText)
    }
  });
} 