import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { 
  generatePatentResponse,
} from '@/app/lib/utils/geminiClient';
import { 
  PATENT_SECTIONS, 
  getSectionById, 
  getRecommendedSequence, 
  analyzePatentConversation 
} from '@/utils/patent-sections';

/**
 * Handle messages in a drafting session
 * 
 * For patent applications, this uses a specialized Gemini integration to:
 * 1. Analyze conversation to track the current section being discussed
 * 2. Generate contextual responses based on section requirements
 * 3. Track progress through patent sections
 * 4. Store metadata about completion status
 */
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
      console.warn('Authentication failed for AI drafting message:', error);
      return NextResponse.json({ 
        error: 'Authentication required to send messages' 
      }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required to send messages' 
      }, { status: 401 });
    }
    
    // Get request body
    const requestData = await request.json();
    const { message, metadata } = requestData;
    
    if (!message) {
      return NextResponse.json({
        error: 'Message content is required'
      }, { status: 400 });
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
    if (!session.conversation_history) {
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
    
    // Add user message to conversation history
    session.conversation_history.push({
      role: 'user',
      content: message
    });
    
    // Initialize metadata if not present
    if (!session.metadata) {
      session.metadata = {};
    }

    // If client provided section metadata, use it (finalizing section logic)
    if (metadata?.patentProgress) {
      session.metadata.patentProgress = {
        ...session.metadata.patentProgress,
        ...metadata.patentProgress
      };
    }
    
    let aiResponse;
    
    // Handle patent applications with our specialized agent
    if (session.document_type === 'patent-application') {
      try {
        // Use existing metadata if available, otherwise analyze the conversation
        let analysis;
        if (session.metadata?.patentProgress) {
          analysis = {
            completed: session.metadata.patentProgress.completedSections || [],
            currentSection: session.metadata.patentProgress.currentSection || null,
            progress: 0, // Will be calculated
            finalizedSections: session.metadata.patentProgress.finalizedSections || []
          };

          // Calculate progress based on completed and finalized sections
          const completedCount = analysis.completed.length;
          const finalizedCount = analysis.finalizedSections.length;
          const totalSections = 9; // Total number of patent sections
          analysis.progress = ((completedCount * 0.3) + (finalizedCount * 0.7)) / totalSections * 100;
        } else {
          // Analyze the conversation to identify the current section
          analysis = analyzePatentConversation(session.conversation_history);
          analysis.finalizedSections = [];
        }
        
        // Store the progress in the session metadata
        if (!session.metadata.patentProgress) {
          session.metadata.patentProgress = {};
        }
        
        session.metadata.patentProgress = {
          completedSections: analysis.completed,
          currentSection: analysis.currentSection,
          progress: analysis.progress,
          finalizedSections: analysis.finalizedSections || []
        };
        
        // Check if the user is finalizing a section
        const isFinalizingMessage = 
          message.toLowerCase().includes('finalize') && 
          (message.toLowerCase().includes('section') || 
           // Check for any section names in the message
           PATENT_SECTIONS.some(section => 
             message.toLowerCase().includes(section.id) || 
             message.toLowerCase().includes(section.name.toLowerCase())
           ));
        
        // Generate a response using the Gemini API
        let responseContent;
        
        // Check if it's a finalization message and build a special response
        if (isFinalizingMessage) {
          // Determine which section the user is trying to finalize
          let sectionToFinalize = null;
          
          // First check if a specific section is mentioned in the message
          for (const section of PATENT_SECTIONS) {
            if (
              message.toLowerCase().includes(section.id) || 
              message.toLowerCase().includes(section.name.toLowerCase())
            ) {
              sectionToFinalize = section.id;
              break;
            }
          }
          
          // If no specific section is found, use the current section
          if (!sectionToFinalize && analysis.currentSection) {
            sectionToFinalize = analysis.currentSection;
          }
          
          // Store section's content summary before finalizing
          let sectionContent = "";
          if (sectionToFinalize) {
            // Find the last assistant message about this section
            const sectionMessages = session.conversation_history.filter(msg => {
              if (msg.role !== 'assistant') return false;
              const section = getSectionById(sectionToFinalize);
              if (!section) return false;
              return (
                msg.content.toLowerCase().includes(section.id.toLowerCase()) || 
                msg.content.toLowerCase().includes(section.name.toLowerCase())
              );
            });
            
            if (sectionMessages.length > 0) {
              const lastMessageForSection = sectionMessages[sectionMessages.length - 1];
              // Clean the content to extract only the actual document text
              sectionContent = lastMessageForSection.content
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/^I'll help you create .*/g, '')
                .replace(/^Let's continue .*/g, '')
                .replace(/^Now, let's work on .*/g, '')
                .replace(/^Let me guide you .*/g, '')
                .replace(/Okay, the .* section is now finalized as: (.*?)(?:\n\nWe can now|$)/s, '$1')
                .replace(/Great! (We've|I've) (completed|finalized) the .* section.*$/s, '')
                .replace(/You can finalize it or continue working on it.*$/s, '')
                .replace(/To finalize, type.*$/s, '')
                .replace(/Let's move on to the next section.*$/s, '')
                .trim();
            }
          }
          
          // Add this section to the finalized sections if it's not already there
          if (sectionToFinalize && 
              !session.metadata.patentProgress.finalizedSections.includes(sectionToFinalize)) {
            session.metadata.patentProgress.finalizedSections.push(sectionToFinalize);
            
            // Add the section content to metadata in structured format
            if (!session.metadata.sectionContents) {
              session.metadata.sectionContents = {};
            }
            if (sectionContent) {
              session.metadata.sectionContents[sectionToFinalize] = sectionContent;
            }
            
            // Remove from completed sections if it's there to avoid double tracking
            session.metadata.patentProgress.completedSections = 
              session.metadata.patentProgress.completedSections.filter(
                id => id !== sectionToFinalize
              );
          }
          
          // Update progress calculation with the newly finalized section
          const finalizedCount = session.metadata.patentProgress.finalizedSections.length;
          const completedCount = session.metadata.patentProgress.completedSections.length;
          const totalSections = PATENT_SECTIONS.length;
          
          // Calculate progress with weighted sections (finalized counts more)
          session.metadata.patentProgress.progress = Math.round(
            ((completedCount * 0.3) + (finalizedCount * 0.7)) / totalSections * 100
          );
          
          // Determine the next section to work on (first incomplete one in recommended order)
          const recommendedOrder = getRecommendedSequence().map(s => s.id);
          const allCompletedSections = [
            ...session.metadata.patentProgress.completedSections,
            ...session.metadata.patentProgress.finalizedSections
          ];
          const nextSection = recommendedOrder.find(id => !allCompletedSections.includes(id)) || null;
          
          // Update the current section to the next section
          session.metadata.patentProgress.currentSection = nextSection;
          
          // Create a response about finalizing the section
          const finalizedSectionName = getSectionById(sectionToFinalize)?.name || 'current';
          const nextSectionName = getSectionById(nextSection)?.name || nextSection;
          
          // Generate structured response with section content
          responseContent = `section: "${finalizedSectionName}"\ncontent: "${sectionContent}"\n\nI've finalized the ${finalizedSectionName} section. It's now locked in as completed content in your draft.${
            nextSection 
              ? `\n\nLet's move on to the ${nextSectionName} section. ${getSectionById(nextSection)?.description || ''} ${
                  // Add some tips for the next section if available
                  getSectionById(nextSection)?.tips?.length 
                    ? `\n\nTips for this section:\n${getSectionById(nextSection)?.tips.map(tip => `• ${tip}`).join('\n')}` 
                    : ''
                }`
              : '\n\nWe have completed all sections for this patent application. Would you like to generate the full document now?'
          }`;
        } else if (analysis.currentSection) {
          // Normal message handling
          responseContent = await generatePatentResponse(
            session.conversation_history, 
            analysis.currentSection,
            session.metadata.patentProgress.completedSections || [],
            session.metadata.patentProgress.finalizedSections || []
          );
          
          console.log(`Generated patent response for section: ${analysis.currentSection}`);
        } else {
          // Fallback for when we can't determine the current section
          responseContent = "I'll help you continue working on your patent application. Which section would you like to focus on next?";
        }
        
        // Clean up formatting for better display - remove asterisks while preserving content
        responseContent = responseContent
          .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold formatting but keep the text
          .replace(/\*([^*]+)\*/g, '$1');     // Remove italic formatting but keep the text
        
        // Add an explicit completion indicator when a section appears to be done
        // This helps the frontend progress tracking detect completed sections
        if (analysis.currentSection && !isFinalizingMessage) {
          const currentSectionName = getSectionById(analysis.currentSection)?.name || analysis.currentSection;
          
          // If there's substantial content and it seems like we're wrapping up a section
          if (responseContent.length > 100 && 
              (responseContent.includes("next section") || 
               responseContent.includes("move on") ||
               responseContent.includes("continue to"))) {
            
            // Add a clear section completion marker
            responseContent += `\n\nGreat! We've completed the ${currentSectionName} section. You can finalize it or continue working on it. To finalize, type "finalize ${currentSectionName} section".`;
          }
        }
        
        aiResponse = {
          role: 'assistant',
          content: responseContent
        };
        
      } catch (patentError) {
        console.error('Error in patent assistant:', patentError);
        
        // Fallback to a generic response if the Gemini API fails
        aiResponse = {
          role: 'assistant',
          content: `Thank you for your input about the patent. I encountered a technical issue with my specialized patent guidance system. Let's continue discussing your patent application. Could you tell me more about your invention?`
        };
      }
    } else {
      // For other document types, use the simple response for now
      aiResponse = {
        role: 'assistant',
        content: `I've received your input about the ${session.document_type}. Let's continue gathering the necessary information. What other details would you like to include?`
      };
    }
    
    // Add AI response to conversation history
    session.conversation_history.push(aiResponse);
    
    // Update the session
    await db.collection('draftingSessions').updateOne(
      { _id: new ObjectId(session_id) },
      { 
        $set: { 
          conversation_history: session.conversation_history,
          metadata: session.metadata || {},
          updated_at: new Date()
        } 
      }
    );
    
    // Return updated session
    return NextResponse.json({
      _id: session._id.toString(),
      document_type: session.document_type,
      status: session.status,
      created_at: session.created_at,
      updated_at: new Date(),
      conversation_history: session.conversation_history,
      metadata: session.metadata || {}
    });
    
  } catch (error: any) {
    console.error('Error sending message to drafting session:', error);
    return NextResponse.json({
      error: 'Failed to send message',
      details: error.message
    }, { status: 500 });
  }
} 