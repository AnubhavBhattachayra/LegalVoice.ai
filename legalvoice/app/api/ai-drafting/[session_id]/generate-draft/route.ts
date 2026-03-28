import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { 
  PATENT_SECTIONS,
  getSectionById 
} from '@/utils/patent-sections';

export async function POST(
  request: NextRequest,
  { params }: { params: { session_id: string } }
) {
  try {
    // Await params first to avoid Next.js warning
    const { session_id } = await Promise.resolve(params);
    
    if (!session_id || !ObjectId.isValid(session_id)) {
      return NextResponse.json({
        error: 'Valid session ID is required'
      }, { status: 400 });
    }
    
    // Get user from auth
    let user = null;
    try {
      user = await getUserFromRequest(request);
    } catch (error) {
      console.warn('Authentication failed for AI drafting document generation:', error);
      return NextResponse.json({ 
        error: 'Authentication required to generate documents' 
      }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required to generate documents' 
      }, { status: 401 });
    }
    
    // Connect to the database
    const { db, error: dbError } = await connectToDatabase();
    
    if (dbError || !db) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json({
        error: 'Database connection failed',
        details: 'Unable to connect to the database. Please try again later.'
      }, { status: 503 });
    }
    
    // Find the session
    const session = await db.collection('draftingSessions').findOne({
      _id: new ObjectId(session_id),
      userId: user.uid
    });
    
    if (!session) {
      return NextResponse.json({
        error: 'Session not found'
      }, { status: 404 });
    }
    
    // Ensure conversation_history exists
    if (!session.conversation_history || !Array.isArray(session.conversation_history)) {
      session.conversation_history = [
        {
          role: 'system',
          content: `You are a legal document drafting assistant. You are helping the user create a ${session.document_type} document.`
        },
        {
          role: 'assistant',
          content: `I'll help you create your ${session.document_type}. Let's gather the information we need.`
        }
      ];
    }
    
    // Generate document content based on conversation history
    const conversationText = session.conversation_history
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');
    
    // Simple document generation based on document type
    let draftContent = '';
    const documentType = session.document_type || 'general';
    
    try {
      if (documentType === 'patent-application') {
        draftContent = generatePatentTemplate(session);
      } else if (documentType === 'contract') {
        draftContent = generateContractTemplate(conversationText);
      } else if (documentType === 'legal-letter') {
        draftContent = generateLetterTemplate(conversationText);
      } else {
        draftContent = `# ${documentType.toUpperCase()}\n\n` + 
          `This document was generated based on our conversation.\n\n` +
          `Document content would go here based on the following context:\n` +
          `${conversationText.substring(0, 500)}...`;
      }
    } catch (genError) {
      console.error('Error in document generation:', genError);
      return NextResponse.json({
        error: 'Document generation failed',
        details: genError.message
      }, { status: 500 });
    }
    
    // Create document data structure
    const documentData = {
      title: `${documentType} - ${new Date().toLocaleDateString()}`,
      content: draftContent,
      metadata: {
        type: documentType,
        created_at: new Date(),
        credits_used: 1
      }
    };
    
    // Update the session
    await db.collection('draftingSessions').updateOne(
      { _id: new ObjectId(session_id) },
      { 
        $set: { 
          status: 'completed',
          draft_content: draftContent,
          document_data: documentData,
          updated_at: new Date()
        } 
      }
    );
    
    // Add completion message to conversation history
    const completionMessage = {
      role: 'assistant',
      content: '✅ Your document has been generated successfully! You can view and edit it in the Documents section.'
    };
    
    await db.collection('draftingSessions').updateOne(
      { _id: new ObjectId(session_id) },
      { $push: { conversation_history: completionMessage } }
    );
    
    // Return the document
    return NextResponse.json({
      _id: session._id.toString(),
      document_type: documentType,
      status: 'completed',
      draft_content: draftContent,
      document_data: documentData,
      credits_used: 1,
      conversation_history: [...session.conversation_history, completionMessage]
    });
    
  } catch (error: any) {
    console.error('Error generating document:', error);
    return NextResponse.json({
      error: 'Failed to generate document',
      details: error.message
    }, { status: 500 });
  }
}

// Helper function to generate a structured patent template using conversation data
function generatePatentTemplate(session) {
  const conversation = session.conversation_history || [];
  const metadata = session.metadata || {};
  const patentProgress = metadata.patentProgress || { 
    completedSections: [],
    finalizedSections: []
  };
  const sectionContents = metadata.sectionContents || {};
  
  // Start with a basic template
  let content = `# PATENT APPLICATION\n\n`;
  
  // Helper function to extract section content from conversation
  function extractSectionContent(sectionId, isFinalized) {
    // First check if we have structured content in metadata
    if (isFinalized && sectionContents[sectionId]) {
      return sectionContents[sectionId];
    }
    
    // Check for structured content format in assistant messages
    const structuredMessages = conversation.filter(msg => 
      msg.role === 'assistant' && 
      (msg.content.startsWith(`section: "${getSectionById(sectionId)?.name}"`) ||
       msg.content.includes(`section: "${getSectionById(sectionId)?.name}"`))
    );
    
    if (structuredMessages.length > 0) {
      // Use the latest structured message
      const latestStructured = structuredMessages[structuredMessages.length - 1];
      const contentMatch = latestStructured.content.match(/content: "([^"]*)"/);
      
      if (contentMatch && contentMatch[1]) {
        return contentMatch[1].trim();
      }
    }
    
    // Get all content related to this section (fallback method)
    const sectionMessages = conversation.filter(msg => {
      const msgContent = msg.content.toLowerCase();
      const section = getSectionById(sectionId);
      if (!section) return false;
      
      return (
        msgContent.includes(section.id.toLowerCase()) || 
        msgContent.includes(section.name.toLowerCase())
      );
    });
    
    if (sectionMessages.length === 0) {
      const section = getSectionById(sectionId);
      return section ? `[${section.name} content would go here]` : `[Section content would go here]`;
    }
    
    // For finalized sections, look for messages that indicate finalization
    if (isFinalized) {
      // Find messages that contain "finalize" and the section name
      const finalizationMessages = sectionMessages.filter(msg => 
        msg.role === 'user' && 
        msg.content.toLowerCase().includes('finalize') && 
        (msg.content.toLowerCase().includes(sectionId) ||
         msg.content.toLowerCase().includes(getSectionById(sectionId)?.name.toLowerCase() || ''))
      );
      
      // If we found finalization messages, get the assistant's response to the last one
      if (finalizationMessages.length > 0) {
        const lastFinalizationIndex = conversation.findIndex(msg => 
          msg === finalizationMessages[finalizationMessages.length - 1]
        );
        
        if (lastFinalizationIndex !== -1 && lastFinalizationIndex < conversation.length - 1) {
          // Get the assistant response that came after the finalization message
          const assistantResponseIndex = lastFinalizationIndex + 1;
          if (assistantResponseIndex < conversation.length && 
              conversation[assistantResponseIndex].role === 'assistant') {
            
            const response = conversation[assistantResponseIndex].content;
            
            // Check for structured format
            const contentMatch = response.match(/content: "([^"]*)"/);
            if (contentMatch && contentMatch[1]) {
              return contentMatch[1].trim();
            }
            
            // Fallback to old cleaning method
            return cleanContentForDocument(response);
          }
        }
      }
    }
    
    // Get only the most recent relevant messages from assistant
    const assistantMessages = sectionMessages
      .filter(msg => msg.role === 'assistant')
      .slice(-2);
      
    // Extract key information
    if (assistantMessages.length > 0) {
      // Get the most informative text (usually the longer ones)
      const sortedByLength = [...assistantMessages].sort(
        (a, b) => b.content.length - a.content.length
      );
      
      // Take the longest message content and clean it up
      return cleanContentForDocument(sortedByLength[0].content);
    }
    
    return `[Content for this section would be generated based on your conversation]`;
  }
  
  // Helper function to clean up content for the document
  function cleanContentForDocument(content) {
    // Check for structured format first
    const contentMatch = content.match(/content: "([^"]*)"/);
    if (contentMatch && contentMatch[1]) {
      return contentMatch[1].trim();
    }
    
    // Otherwise clean up with regex
    return content
      // Remove prompting phrases
      .replace(/^I'll help you create .*/g, '')
      .replace(/^Let's continue .*/g, '')
      .replace(/^Now, let's work on .*/g, '')
      .replace(/^What details would you like .*/g, '')
      .replace(/^Let me guide you .*/g, '')
      // Remove any questions at the end
      .replace(/\?(\s*)$/g, '')
      // Remove asterisks for formatting while preserving text
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold formatting
      .replace(/\*([^*]+)\*/g, '$1')      // Remove italic formatting
      // Remove section completion indicators
      .replace(/\n\nGreat! We've completed the .* section. Let's move on to the next section\./, '')
      .replace(/You can finalize it or continue working on it.*/, '')
      .replace(/To finalize, type.*/, '')
      .replace(/section: ".*" content: "(.*)"/, '$1')
      .trim();
  }
  
  // Add finalized and completed sections to the document
  PATENT_SECTIONS.forEach(section => {
    const isFinalized = patentProgress.finalizedSections?.includes(section.id);
    const isCompleted = patentProgress.completedSections?.includes(section.id);
    
    content += `## ${section.name.toUpperCase()}\n\n`;
    
    if (isFinalized) {
      // Prioritize finalized sections
      const sectionContent = extractSectionContent(section.id, true);
      content += sectionContent;
      content += '\n\n*[Section Finalized]*\n\n';
    } else if (isCompleted) {
      content += extractSectionContent(section.id, false);
      content += '\n\n*[Section Completed]*\n\n';
    } else if (section.id === patentProgress.currentSection) {
      content += `${extractSectionContent(section.id, false)}\n\n*[This section is currently in progress]*\n\n`;
    } else {
      content += `*[This section has not been completed yet]*\n\n`;
    }
  });
  
  // Add a note about the document status
  const finalizedCount = patentProgress.finalizedSections?.length || 0;
  const completedCount = patentProgress.completedSections?.length || 0;
  const totalSections = PATENT_SECTIONS.length;
  const progressPercentage = Math.round(((completedCount * 0.3) + (finalizedCount * 0.7)) / totalSections * 100);
  
  content += `---\n\n`;
  content += `Document Status: ${progressPercentage}% complete\n`;
  content += `${finalizedCount} sections finalized / ${completedCount} sections in progress / ${totalSections} total sections\n`;
  content += `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n`;
  
  return content;
}

// Helper function to generate a simple contract template
function generateContractTemplate(conversationText) {
  return `# CONTRACT AGREEMENT\n\n` +
    `THIS AGREEMENT is made as of ${new Date().toLocaleDateString()},\n\n` +
    `BETWEEN:\n\n` +
    `PARTY A\n\n` +
    `AND\n\n` +
    `PARTY B\n\n` +
    `WHEREAS the parties wish to enter into an agreement;\n\n` +
    `NOW THEREFORE in consideration of the mutual covenants contained herein, the parties agree as follows:\n\n` +
    `1. TERM\n\n` +
    `2. COMPENSATION\n\n` +
    `3. RESPONSIBILITIES\n\n` +
    `4. TERMINATION\n\n` +
    `5. MISCELLANEOUS\n\n` +
    `IN WITNESS WHEREOF the parties have executed this Agreement.\n\n`;
}

// Helper function to generate a simple legal letter template
function generateLetterTemplate(conversationText) {
  return `# LEGAL LETTER\n\n` +
    `${new Date().toLocaleDateString()}\n\n` +
    `[RECIPIENT NAME]\n` +
    `[RECIPIENT ADDRESS]\n\n` +
    `Dear [RECIPIENT],\n\n` +
    `Re: [SUBJECT]\n\n` +
    `I am writing in reference to...\n\n` +
    `Please contact me if you have any questions.\n\n` +
    `Sincerely,\n\n` +
    `[SENDER NAME]\n`;
} 