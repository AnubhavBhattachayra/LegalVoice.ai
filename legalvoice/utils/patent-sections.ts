// Patent sections information

export interface PatentSection {
  id: string;
  name: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  tips: string[];
}

// Define all patent application sections with metadata
export const PATENT_SECTIONS: PatentSection[] = [
  {
    id: 'title',
    name: 'Title',
    description: 'Brief title for the invention',
    importance: 'high',
    tips: [
      'Keep it concise (ideally under 15 words)',
      'Be descriptive but avoid unnecessary details',
      'Focus on the invention, not its advantages',
      'Use proper technical terminology'
    ]
  },
  {
    id: 'field',
    name: 'Field of Invention',
    description: 'Technical field to which the invention belongs',
    importance: 'medium',
    tips: [
      'Clearly state the general field of technology',
      'Mention any subfields if applicable',
      'Keep it brief and factual',
      'Avoid mentioning advantages or features'
    ]
  },
  {
    id: 'background',
    name: 'Background',
    description: 'Existing technologies and their limitations',
    importance: 'high',
    tips: [
      'Describe the existing technology objectively',
      'Identify problems with current solutions',
      'Cite specific prior art if known',
      'Avoid disparaging competitors directly',
      'Create a narrative that leads to your invention'
    ]
  },
  {
    id: 'objects',
    name: 'Objects',
    description: 'Technical problems and solutions',
    importance: 'medium',
    tips: [
      'State the technical problems being solved',
      'Present objectives in a logical order',
      'Be specific about technical goals',
      'Connect problems to your invention\'s solutions',
      'Avoid business advantages or marketing language'
    ]
  },
  {
    id: 'summary',
    name: 'Summary',
    description: 'Concise overview of the invention',
    importance: 'high',
    tips: [
      'Provide a broad overview of the invention',
      'Describe key components and their relationships',
      'Highlight novel aspects without limiting scope',
      'Include important variations or embodiments',
      'Ensure consistency with the claims'
    ]
  },
  {
    id: 'drawings',
    name: 'Drawings Description',
    description: 'Explanation of figures',
    importance: 'medium',
    tips: [
      'List and briefly describe each figure',
      'Use consistent numbering for components',
      'Be concise but clear about what each figure shows',
      'Include all views necessary to understand the invention',
      'Cross-reference with the detailed description'
    ]
  },
  {
    id: 'detailed',
    name: 'Detailed Description',
    description: 'Complete explanation of the invention',
    importance: 'high',
    tips: [
      'Describe how to make and use the invention in detail',
      'Cover all embodiments mentioned in the claims',
      'Include alternative implementations',
      'Use reference numbers consistently with drawings',
      'Provide enough detail for someone skilled in the art to replicate'
    ]
  },
  {
    id: 'claims',
    name: 'Claims',
    description: 'Legal scope of protection sought',
    importance: 'high',
    tips: [
      'Start with the broadest independent claim',
      'Follow with dependent claims adding limitations',
      'Use clear, definite language',
      'Ensure each claim is fully supported in the specification',
      'Structure claims as a single sentence'
    ]
  },
  {
    id: 'abstract',
    name: 'Abstract',
    description: 'Brief summary of the invention',
    importance: 'medium',
    tips: [
      'Keep it under 150 words',
      'Summarize the technical solution in simple terms',
      'Include the main technical problem addressed',
      'Focus on novel features',
      'Avoid legal or claim-style language'
    ]
  }
];

// Get suggested prompts for a specific section
export const getPromptsForSection = (sectionId: string): string[] => {
  const promptsBySection: Record<string, string[]> = {
    'title': [
      'Help me create a concise title for my invention',
      'What makes a good patent title?',
      'Is this title too broad: "[Your Title]"?'
    ],
    'field': [
      'My invention relates to the field of...',
      'How should I describe the technical field?',
      'What level of detail is appropriate for this section?'
    ],
    'background': [
      'Existing solutions have these problems...',
      'What should I include in the background section?',
      'How do I discuss prior art without limiting my claims?'
    ],
    'objects': [
      'The main goal of my invention is to...',
      'Help me describe the objectives of my invention',
      'How specific should my objectives be?'
    ],
    'summary': [
      'In summary, my invention...',
      'How do I write an effective summary?',
      'What\'s the difference between summary and abstract?'
    ],
    'drawings': [
      'I need to describe Figure 1 which shows...',
      'How do I reference drawings in a patent?',
      'What views should I include for a mechanical device?'
    ],
    'detailed': [
      'Let me describe how my invention works in detail',
      'How specific should I be in this section?',
      'How do I describe alternative embodiments?'
    ],
    'claims': [
      'Help me draft the independent claims',
      'What are dependent claims and how do I write them?',
      'How do I ensure my claims are properly supported?'
    ],
    'abstract': [
      'I need an abstract that summarizes my invention',
      'What should I include in the abstract?',
      'How technical should the abstract be?'
    ]
  };
  
  return promptsBySection[sectionId] || [];
};

// Get a section by ID
export const getSectionById = (id: string): PatentSection | undefined => {
  return PATENT_SECTIONS.find(section => section.id === id);
};

// Get the next logical section to work on
export const getNextSection = (completedSections: string[]): string | null => {
  const allSectionIds = PATENT_SECTIONS.map(s => s.id);
  return allSectionIds.find(id => !completedSections.includes(id)) || null;
};

// Get the typical sequence of drafting
export const getRecommendedSequence = (): PatentSection[] => {
  // Recommended order may differ from the order in the document
  const recommendedOrder = [
    'title', 'field', 'background', 'objects', 
    'summary', 'drawings', 'detailed', 'claims', 'abstract'
  ];
  
  return recommendedOrder.map(id => {
    const section = getSectionById(id);
    if (!section) throw new Error(`Section with id ${id} not found`);
    return section;
  });
};

// Analyze a patent conversation to identify completed sections
export const analyzePatentConversation = (
  conversationText: string
): { 
  completed: string[]; 
  currentSection: string | null;
  finalizedSections: string[];
  progress: number;
} => {
  const completed: string[] = [];
  const finalizedSections: string[] = [];
  
  // Clean up the conversation text - remove asterisks for formatting
  const cleanedText = conversationText
    .replace(/\*\*/g, '')  // Remove bold formatting
    .replace(/\*/g, '')    // Remove italic formatting
    .toLowerCase();
  
  // Patterns that indicate section completion
  const completionPhrases = [
    'section complete',
    'section is complete',
    'section completed',
    'completed this section',
    'finished this section',
    'move to next section',
    "let's move on to",
    'move forward to',
    'completed successfully',
    'section looks good'
  ];
  
  // Patterns that indicate section finalization
  const finalizationPhrases = [
    'finalize this section',
    'finalize the section',
    'section finalized',
    'finalize section',
    'this looks final',
    'happy with this section',
    'this is final',
    'mark as final',
    'section is finished',
    'content is finalized'
  ];
  
  // Strong indicators for active discussion of a section
  const sectionDiscussionPhrases = [
    'working on the',
    'focusing on the',
    'in the',
    'for the',
    'discussing the',
    'about the'
  ];
  
  // Check each section
  PATENT_SECTIONS.forEach(section => {
    // Look for keywords that would indicate this section was discussed
    const sectionKeywords = [
      section.id,
      section.name.toLowerCase(),
      ...section.description.toLowerCase().split(' ').filter(word => word.length > 4)
    ];
    
    // Count mentions of this section
    let mentionCount = 0;
    
    // Check for section keywords
    const isMentioned = sectionKeywords.some(keyword => {
      if (cleanedText.includes(keyword)) {
        mentionCount += (cleanedText.match(new RegExp(keyword, 'g')) || []).length;
        return true;
      }
      return false;
    });
    
    // Check if any completion phrases appear near section keywords
    const isExplicitlyCompleted = completionPhrases.some(phrase => {
      return sectionKeywords.some(keyword => 
        cleanedText.includes(`${keyword} ${phrase}`) || 
        cleanedText.includes(`${phrase} ${keyword}`) ||
        cleanedText.includes(`${section.name.toLowerCase()} ${phrase}`)
      );
    });
    
    // Check if any finalization phrases appear near section keywords
    const isExplicitlyFinalized = finalizationPhrases.some(phrase => {
      return sectionKeywords.some(keyword => 
        cleanedText.includes(`${keyword} ${phrase}`) || 
        cleanedText.includes(`${phrase} ${keyword}`) ||
        cleanedText.includes(`${section.name.toLowerCase()} ${phrase}`)
      );
    });
    
    // Check if content suggests substantive work on this section
    const hasSubstantiveContent = mentionCount >= 3;
    
    // Detect if there's clear discussion of this section
    const hasActiveSectionDiscussion = sectionDiscussionPhrases.some(phrase => 
      cleanedText.includes(`${phrase} ${section.name.toLowerCase()} section`)
    );
    
    // Consider a section complete if:
    // 1. It's explicitly marked as complete, OR
    // 2. It's mentioned multiple times (suggesting substantial discussion), OR
    // 3. There's clear discussion about the section AND some content related to it
    if (isExplicitlyCompleted || hasSubstantiveContent || (hasActiveSectionDiscussion && mentionCount >= 2)) {
      completed.push(section.id);
    }
    
    // Consider a section finalized if it contains finalization phrases
    if (isExplicitlyFinalized) {
      finalizedSections.push(section.id);
    }
  });
  
  // Remove finalized sections from completed (to avoid double-counting)
  const completedNotFinalized = completed.filter(id => !finalizedSections.includes(id));
  
  // Determine current section (first incomplete one in recommended order)
  const allCompletedSections = [...completedNotFinalized, ...finalizedSections];
  const recommendedOrder = getRecommendedSequence().map(s => s.id);
  const currentSection = recommendedOrder.find(id => !allCompletedSections.includes(id)) || null;
  
  // Calculate overall progress percentage
  // Finalized sections count more toward progress than sections just completed
  const finalizedWeight = 0.7; // 70% weight for finalized sections
  const completedWeight = 0.3; // 30% weight for completed but not finalized
  
  const weightedProgress = 
    (finalizedSections.length * finalizedWeight) + 
    (completedNotFinalized.length * completedWeight);
  
  const totalSectionWeight = PATENT_SECTIONS.length; // If each section had a weight of 1.0
  const progress = Math.round((weightedProgress / totalSectionWeight) * 100);
  
  return { 
    completed: completedNotFinalized, 
    currentSection, 
    finalizedSections,
    progress 
  };
}; 