import { PDFDocument } from 'pdf-lib';
import { readFile } from 'fs/promises';
import { extname } from 'path';
import mammoth from 'mammoth';

export async function extractDocumentText(fileUrl: string): Promise<string> {
  try {
    // Download the file
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();

    // Get file extension
    const fileExtension = extname(fileUrl).toLowerCase();

    // Extract text based on file type
    switch (fileExtension) {
      case '.pdf':
        return await extractPDFText(buffer);
      case '.docx':
        return await extractDOCXText(buffer);
      case '.doc':
        return await extractDOCText(buffer);
      case '.txt':
        return await extractTXTText(buffer);
      default:
        throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Error extracting document text:', error);
    throw error;
  }
}

async function extractPDFText(buffer: ArrayBuffer): Promise<string> {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    let text = '';

    // Extract text from each page
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      
      // Extract text from the page
      const textContent = await page.getTextContent();
      text += textContent + '\n\n';
    }

    return text.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw error;
  }
}

async function extractDOCXText(buffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting DOCX text:', error);
    throw error;
  }
}

async function extractDOCText(buffer: ArrayBuffer): Promise<string> {
  // Note: DOC format is binary and requires special handling
  // You might want to use a library like antiword or convert to DOCX first
  throw new Error('DOC format not supported yet');
}

async function extractTXTText(buffer: ArrayBuffer): Promise<string> {
  try {
    const text = new TextDecoder().decode(buffer);
    return text.trim();
  } catch (error) {
    console.error('Error extracting TXT text:', error);
    throw error;
  }
}

// Helper function to clean extracted text
export function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n\n') // Replace multiple newlines with double newline
    .replace(/[^\S\r\n]+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

// Helper function to detect document type
export function detectDocumentType(text: string): string {
  const patterns = {
    contract: /(contract|agreement|terms and conditions|lease|license)/i,
    legalNotice: /(notice|cease and desist|demand letter)/i,
    courtDocument: /(petition|complaint|motion|brief|affidavit)/i,
    propertyDocument: /(deed|title|mortgage|lease agreement)/i,
    businessDocument: /(incorporation|bylaws|minutes|resolution)/i,
    intellectualProperty: /(patent|trademark|copyright|intellectual property)/i,
    employmentDocument: /(employment agreement|non-disclosure|non-compete)/i,
    financialDocument: /(financial statement|tax return|audit report)/i,
    regulatoryDocument: /(regulation|compliance|permit|license)/i,
    personalDocument: /(will|trust|power of attorney|living will)/i
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      return type;
    }
  }

  return 'other';
}

// Helper function to extract key information
export function extractKeyInformation(text: string): Record<string, any> {
  const keyInfo: Record<string, any> = {
    dates: extractDates(text),
    parties: extractParties(text),
    amounts: extractAmounts(text),
    references: extractReferences(text),
    deadlines: extractDeadlines(text)
  };

  return keyInfo;
}

function extractDates(text: string): string[] {
  const datePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // MM/DD/YYYY
    /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g, // MM-DD-YYYY
    /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}\b/gi, // DD MMM YYYY
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}\b/gi // MMM DD, YYYY
  ];

  const dates: string[] = [];
  for (const pattern of datePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      dates.push(...matches);
    }
  }

  return [...new Set(dates)]; // Remove duplicates
}

function extractParties(text: string): string[] {
  const partyPatterns = [
    /\b(?:between|by and between|among)\s+([^.,]+?)(?:and|&)\s+([^.,]+)/gi,
    /\b(?:party|parties)\s+of\s+the\s+(?:first|second|third|fourth)\s+part\b/gi,
    /\b(?:hereinafter\s+referred\s+to\s+as)\s+"([^"]+)"/gi
  ];

  const parties: string[] = [];
  for (const pattern of partyPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      parties.push(...matches);
    }
  }

  return [...new Set(parties)]; // Remove duplicates
}

function extractAmounts(text: string): string[] {
  const amountPatterns = [
    /\$\s*\d+(?:,\d{3})*(?:\.\d{2})?/g, // Currency amounts
    /\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|GBP|INR)\b/gi, // Currency with code
    /\b(?:amount|sum|payment|fee|cost|price)\s+of\s+\$\s*\d+(?:,\d{3})*(?:\.\d{2})?\b/gi // Amount with context
  ];

  const amounts: string[] = [];
  for (const pattern of amountPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      amounts.push(...matches);
    }
  }

  return [...new Set(amounts)]; // Remove duplicates
}

function extractReferences(text: string): string[] {
  const referencePatterns = [
    /\b(?:reference|ref\.|ref no\.|document no\.|doc\. no\.)\s*[:#]?\s*[A-Z0-9-]+/gi,
    /\b[A-Z]{2,3}-\d{4,6}(?:-\d{2})?\b/g, // Reference number format
    /\b(?:section|clause|article|paragraph)\s+\d+(?:\.\d+)*\b/g // Section references
  ];

  const references: string[] = [];
  for (const pattern of referencePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      references.push(...matches);
    }
  }

  return [...new Set(references)]; // Remove duplicates
}

function extractDeadlines(text: string): string[] {
  const deadlinePatterns = [
    /\b(?:deadline|due date|expiration|expiry|termination)\s+(?:date|by|on|before)\s+[^.,]+/gi,
    /\b(?:within|not later than|no later than)\s+\d+\s+(?:days|weeks|months|years)\b/gi,
    /\b(?:effective|commencement|start)\s+date\s+[^.,]+/gi
  ];

  const deadlines: string[] = [];
  for (const pattern of deadlinePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      deadlines.push(...matches);
    }
  }

  return [...new Set(deadlines)]; // Remove duplicates
} 