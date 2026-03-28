// Document types and their keywords
const DOCUMENT_TYPES = {
  'rent_agreement': ['rent', 'lease', 'tenancy', 'landlord', 'tenant'],
  'power_of_attorney': ['power of attorney', 'poa', 'authorization'],
  'affidavit': ['affidavit', 'sworn statement', 'declaration'],
  'fir': ['fir', 'first information report', 'police complaint'],
  'patent': ['patent', 'intellectual property', 'invention'],
  'legal_notice': ['legal notice', 'cease and desist', 'warning'],
  'will': ['will', 'testament', 'inheritance'],
  'contract': ['contract', 'agreement', 'terms and conditions'],
  'complaint': ['complaint', 'grievance', 'dispute'],
  'application': ['application', 'request', 'petition']
};

// Legal topics and their keywords
const LEGAL_TOPICS = {
  'property_law': ['property', 'real estate', 'land', 'ownership'],
  'criminal_law': ['crime', 'criminal', 'offense', 'penalty'],
  'family_law': ['divorce', 'custody', 'marriage', 'family'],
  'business_law': ['business', 'company', 'corporate', 'contract'],
  'intellectual_property': ['patent', 'trademark', 'copyright', 'ip'],
  'labor_law': ['employment', 'labor', 'workplace', 'employee'],
  'consumer_law': ['consumer', 'product', 'service', 'complaint'],
  'tax_law': ['tax', 'income', 'gst', 'taxation'],
  'constitutional_law': ['constitution', 'rights', 'fundamental'],
  'environmental_law': ['environment', 'pollution', 'conservation']
};

export function extractDocumentType(text: string): string | undefined {
  const lowerText = text.toLowerCase();
  
  for (const [type, keywords] of Object.entries(DOCUMENT_TYPES)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return type;
    }
  }
  
  return undefined;
}

export function extractFormFields(text: string): Record<string, any> | undefined {
  const fields: Record<string, any> = {};
  
  // Extract common form fields
  const commonFields = {
    name: /(?:name|full name|fullname)[:：]?\s*([^\n]+)/i,
    address: /(?:address|residential address)[:：]?\s*([^\n]+)/i,
    phone: /(?:phone|mobile|contact)[:：]?\s*([^\n]+)/i,
    email: /(?:email|e-mail)[:：]?\s*([^\n]+)/i,
    date: /(?:date|dated)[:：]?\s*([^\n]+)/i,
    amount: /(?:amount|sum|value)[:：]?\s*([^\n]+)/i
  };

  for (const [field, regex] of Object.entries(commonFields)) {
    const match = text.match(regex);
    if (match) {
      fields[field] = match[1].trim();
    }
  }

  return Object.keys(fields).length > 0 ? fields : undefined;
}

export function extractLegalTopic(text: string): string | undefined {
  const lowerText = text.toLowerCase();
  
  for (const [topic, keywords] of Object.entries(LEGAL_TOPICS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return topic;
    }
  }
  
  return undefined;
}

export function extractReferences(text: string): Array<{ title: string; url: string }> {
  const references: Array<{ title: string; url: string }> = [];
  
  // Extract URLs and their titles
  const urlRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = urlRegex.exec(text)) !== null) {
    references.push({
      title: match[1],
      url: match[2]
    });
  }
  
  return references;
}

export function calculateConfidence(text: string): number {
  // Simple confidence calculation based on response characteristics
  let confidence = 0.8; // Base confidence
  
  // Increase confidence if response includes references
  if (text.includes('[') && text.includes(']')) {
    confidence += 0.1;
  }
  
  // Increase confidence if response includes specific legal terms
  const legalTerms = ['shall', 'hereby', 'pursuant', 'notwithstanding', 'whereas'];
  const termCount = legalTerms.filter(term => text.toLowerCase().includes(term)).length;
  confidence += termCount * 0.02;
  
  // Cap confidence at 1.0
  return Math.min(confidence, 1.0);
}

export function extractSource(text: string): string | undefined {
  // Extract source from text (e.g., document name, URL, or reference)
  const sourceRegex = /(?:source|document|file)[:：]?\s*([^\n]+)/i;
  const match = text.match(sourceRegex);
  
  return match ? match[1].trim() : undefined;
}

// Helper function to clean and normalize text
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?-]/g, '')
    .trim()
    .toLowerCase();
} 