import { NextRequest, NextResponse } from 'next/server';

// Comprehensive patent guidelines based on the provided structure
const patentGuidelines = {
  "patentWritingGuidelines": {
    "title": {
      "description": "Brief title for the invention",
      "requirements": [
        "Should be free from fancy expressions or ambiguity",
        "Should be precise and definite",
        "Should not exceed 15 words"
      ]
    },
    "fieldOfInvention": {
      "description": "The technical area to which the invention belongs",
      "requirements": [
        "Should explain advantages of the invention",
        "Should provide evidence to support industrial applicability"
      ]
    },
    "backgroundOfInvention": {
      "description": "Similar to literature survey",
      "requirements": [
        "Describe existing technologies and their limitations",
        "Clearly distinguish your invention from closest prior art"
      ]
    },
    "objectsOfInvention": {
      "description": "Technical problems and solutions",
      "requirements": [
        "Clearly mention technical problems with existing technology",
        "Describe the solution provided by the invention",
        "Highlight differences between claimed invention and prior art"
      ]
    },
    "summaryOfInvention": {
      "description": "Concise overview of the invention",
      "requirements": [
        "Should provide a summary before detailed description",
        "Should highlight key aspects and benefits"
      ]
    },
    "briefDescriptionOfDrawings": {
      "description": "Explanation of what each figure represents",
      "example": "Figure 1 is the 3D model of the proposed invention"
    },
    "detailedDescription": {
      "description": "Complete explanation of the invention",
      "requirements": [
        "Should contain sufficient detail to give complete picture of invention",
        "Should use bullet points and be precise",
        "Should enable a person skilled in the art to replicate the invention"
      ]
    },
    "claims": {
      "description": "Defines legal scope of protection sought",
      "importance": "Very important part of patent writing",
      "notes": [
        "Technical facts expressed in legal terms defining the scope of invention",
        "What is not claimed stands disclaimed and is open to public use",
        "Claims must be clear, concise and supported by description"
      ]
    },
    "figures": {
      "description": "Technical drawings of the invention",
      "requirements": [
        "Should be on A4 size sheets",
        "Clear margin of at least 4 cm on top and left, 3 cm at bottom and right",
        "Dimensions should not be marked on drawing",
        "Drawings must be sequentially or systematically numbered at right hand bottom corner"
      ]
    },
    "abstract": {
      "description": "Brief summary of the invention",
      "requirements": [
        "Should not exceed 150 words",
        "Should specify technical field of invention",
        "Should identify technical problem and its solution",
        "Should indicate potential end users or applications"
      ]
    }
  },
  "filingProcedure": {
    "requiredForms": [
      {
        "name": "Form 1",
        "description": "Application for Grant of Patent",
        "fee": "1750 (physical filing)"
      },
      {
        "name": "Form 2",
        "description": "Complete Specification"
      },
      {
        "name": "Form 3",
        "description": "Statement and Undertaking Under Section 8"
      },
      {
        "name": "Form 5",
        "description": "Declaration as to Inventorship"
      },
      {
        "name": "Form 9",
        "description": "Request for Publication",
        "fee": "2750"
      },
      {
        "name": "Form 18A",
        "description": "Request/Express Request for Examination of Application for Patent",
        "fee": "4400"
      }
    ],
    "additionalFees": [
      {
        "description": "Per claim more than 10",
        "fee": "350"
      },
      {
        "description": "For each sheet of specification in addition to 30",
        "fee": "180"
      }
    ]
  },
  "patentResources": {
    "searchPortals": [
      {
        "name": "Espacenet",
        "url": "https://worldwide.espacenet.com/",
        "description": "Global patent search portal"
      },
      {
        "name": "Indian Patent Office",
        "url": "http://www.ipindia.nic.in/",
        "description": "Official portal for Indian patents"
      }
    ],
    "trackingApplication": "After submission, check for published patent weekly in the Indian patent office journal"
  },
  "importantNotes": {
    "exclusiveRights": "Patents provide exclusive rights to the inventor",
    "returns": "Patents can provide higher returns on investments",
    "licensing": "Patents offer opportunity to license or sell the invention"
  }
};

// Map the section names from our API to the ones in the patentWritingGuidelines
const sectionMapping = {
  'title': 'title',
  'background': 'backgroundOfInvention',
  'summary': 'summaryOfInvention',
  'description': 'detailedDescription',
  'claims': 'claims',
  'abstract': 'abstract',
  // Add other mappings as needed
  'field': 'fieldOfInvention',
  'objects': 'objectsOfInvention',
  'drawings': 'briefDescriptionOfDrawings',
  'figures': 'figures'
};

// Function to convert guidelines format to match expected frontend format
function formatGuidelinesForSection(section, guidelineData) {
  // Find the matching section in the patentWritingGuidelines
  const mappedSection = sectionMapping[section] || section;
  const sectionData = guidelineData.patentWritingGuidelines[mappedSection];

  if (!sectionData) {
    return [];
  }

  // Create an array of guidelines based on the section data
  const guidelines = [];

  // Main guideline from description
  guidelines.push({
    _id: `${mappedSection}_main`,
    title: mappedSection.charAt(0).toUpperCase() + mappedSection.slice(1).replace(/([A-Z])/g, ' $1').trim(),
    section: section,
    order: 1,
    content: sectionData.description
  });

  // Requirements as separate guidelines
  if (sectionData.requirements) {
    sectionData.requirements.forEach((req, index) => {
      guidelines.push({
        _id: `${mappedSection}_req_${index}`,
        title: `Requirement ${index + 1}`,
        section: section,
        order: index + 2,
        content: req
      });
    });
  }

  // Notes as separate guidelines
  if (sectionData.notes) {
    sectionData.notes.forEach((note, index) => {
      guidelines.push({
        _id: `${mappedSection}_note_${index}`,
        title: `Note ${index + 1}`,
        section: section,
        order: index + 2 + (sectionData.requirements?.length || 0),
        content: note
      });
    });
  }

  // Example if present
  if (sectionData.example) {
    guidelines.push({
      _id: `${mappedSection}_example`,
      title: 'Example',
      section: section,
      order: guidelines.length + 1,
      content: sectionData.example,
      examples: [sectionData.example]
    });
  }

  return guidelines;
}

export async function GET(req: NextRequest) {
  try {
    // Get section from the URL search params
    const { searchParams } = new URL(req.url);
    const section = searchParams.get('section');
    
    if (!section) {
      return NextResponse.json(
        { message: 'Missing required parameter: section' },
        { status: 400 }
      );
    }

    // Generate guidelines from our structured data
    const guidelines = formatGuidelinesForSection(section, patentGuidelines);

    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (guidelines.length === 0) {
      console.warn(`No guidelines found for section: ${section}`);
      return NextResponse.json({ guidelines: [] }, { headers });
    }

    return NextResponse.json({ guidelines }, { headers });
  } catch (error) {
    console.error('Error fetching patent guidelines:', error);

    // Return a helpful error message with CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    return NextResponse.json(
      {
        message: 'Failed to fetch patent guidelines',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
} 