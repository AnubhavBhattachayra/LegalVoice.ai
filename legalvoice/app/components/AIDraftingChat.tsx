'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaMicrophone, FaMicrophoneSlash, FaPaperPlane, FaFileAlt, FaSpinner, FaDownload } from 'react-icons/fa';
import { FiMic, FiMicOff, FiSend, FiX } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import { BsPersonCircle, BsInfoCircle } from 'react-icons/bs';
import { AiOutlineFileAdd, AiOutlineLoading3Quarters } from 'react-icons/ai';
import axios from 'axios';
import { 
  PATENT_SECTIONS, 
  getPromptsForSection, 
  getSectionById,
  analyzePatentConversation as analyzeSections 
} from '@/utils/patent-sections';

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface DraftingSession {
  _id: string;
  user_id: string;
  document_type: string;
  conversation_history: ConversationMessage[];
  document_data: any;
  draft_content: string | null;
  status: 'in_progress' | 'completed';
  credit_cost: number;
  created_at: string;
  updated_at: string;
  metadata?: {
    patentProgress: {
      completedSections: string[];
      currentSection: string | null;
    };
  };
}

interface PatentGuideline {
  _id: string;
  section: string;
  title: string;
  content: string;
  order: number;
  examples?: string[];
  tips?: string[];
}

interface AIDraftingChatProps {
  sessionId?: string;
  documentType?: string;
  initialMessage?: string;
  onDocumentGenerated?: (documentId: string) => void;
}

const AIDraftingChat: React.FC<AIDraftingChatProps> = ({
  sessionId,
  documentType = '',
  initialMessage = '',
  onDocumentGenerated
}) => {
  const [session, setSession] = useState<DraftingSession | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [sectionGuidelines, setSectionGuidelines] = useState<PatentGuideline[]>([]);
  const [isLoadingGuidelines, setIsLoadingGuidelines] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  
  // Real-time draft visualization state
  const [draftPreview, setDraftPreview] = useState<Record<string, string>>({});
  const [typingEffect, setTypingEffect] = useState<boolean>(false);
  const [typingSection, setTypingSection] = useState<string | null>(null);
  
  // Add state variables for section finalization
  const [finalizedSections, setFinalizedSections] = useState<string[]>([]);
  const [draftMode, setDraftMode] = useState<'brainstorming' | 'finalized'>('brainstorming');
  const [showFinalizeButton, setShowFinalizeButton] = useState<boolean>(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognition = useRef<any>(null);
  const router = useRouter();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition.current = new SpeechRecognition();
        recognition.current.continuous = true;
        recognition.current.interimResults = true;
        
        recognition.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          
          setInput(transcript);
        };
        
        recognition.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsRecording(false);
        };
      }
    }
  }, []);

  // Fetch or create session
  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    } else if (documentType && initialMessage) {
      createNewSession();
    }
  }, [sessionId, documentType, initialMessage]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
    
    // Analyze patent conversation when messages change
    if (session?.document_type === 'patent-application' && messages.length > 0) {
      // Use the metadata from the session response if available
      if (session.metadata?.patentProgress) {
        const completedSectionsList = session.metadata.patentProgress.completedSections || [];
        const finalizedSectionsList = session.metadata.patentProgress.finalizedSections || [];
        const currentSectionValue = session.metadata.patentProgress.currentSection || null;
        
        setCompletedSections(completedSectionsList);
        setCurrentSection(currentSectionValue);
        setFinalizedSections(finalizedSectionsList);
        
        // Update draft preview and handle typing effect separately
        const sectionForTypingEffect = updateDraftPreview(
          completedSectionsList,
          finalizedSectionsList,
          messages
        );
        
        // Apply typing effect if needed
        if (sectionForTypingEffect) {
          setTypingEffect(true);
          setTypingSection(sectionForTypingEffect);
          
          // End typing effect after 2 seconds
          const timer = setTimeout(() => {
            setTypingEffect(false);
            setTypingSection(null);
          }, 2000);
          
          // Clean up timer
          return () => clearTimeout(timer);
        }
      } else {
        // Fallback to local analysis if no metadata
        const sectionForTypingEffect = analyzePatentConversation(messages);
        
        // Apply typing effect if needed
        if (sectionForTypingEffect) {
          setTypingEffect(true);
          setTypingSection(sectionForTypingEffect);
          
          // End typing effect after 2 seconds
          const timer = setTimeout(() => {
            setTypingEffect(false);
            setTypingSection(null);
          }, 2000);
          
          // Clean up timer
          return () => clearTimeout(timer);
        }
      }
    }
    
    // No cleanup needed if no timer was set
    return undefined;
  }, [messages, session?.document_type, session?.metadata]);

  // Separate effect for handling finalize button visibility
  useEffect(() => {
    if (session?.document_type === 'patent-application' && currentSection) {
      const sectionMessages = messages.filter(msg => 
        msg.role !== 'system' && 
        (msg.content.toLowerCase().includes(currentSection.toLowerCase()) || 
         (getSectionById(currentSection)?.name.toLowerCase() || '').includes(msg.content.toLowerCase()))
      );
      
      // If we have 2+ exchanges about this section and not finalized yet
      setShowFinalizeButton(
        sectionMessages.length >= 4 && 
        !finalizedSections.includes(currentSection)
      );
    } else {
      setShowFinalizeButton(false);
    }
  }, [currentSection, finalizedSections, messages, session?.document_type]);

  // Fetch guidelines for current section
  useEffect(() => {
    if (session?.document_type === 'patent-application' && currentSection) {
      fetchGuidelinesForSection(currentSection);
    }
  }, [currentSection, session?.document_type]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSession = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/ai-drafting/sessions/${id}`);
      setSession(response.data);
      setMessages(response.data.conversation_history);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch session');
      setIsLoading(false);
    }
  };

  const createNewSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.post('/api/ai-drafting/start-session', {
        document_type: documentType,
        initial_message: initialMessage
      }, { headers });
      
      setSession(response.data);
      setMessages(response.data.conversation_history);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to create drafting session:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to create session';
      setError(`Error: ${errorMessage}. Please try again later.`);
      setIsLoading(false);
      
      // Add a fallback message if API call fails
      setMessages([
        {
          role: 'assistant',
          content: 'I apologize, but I am having trouble starting our document drafting session. This could be due to connection issues or server problems. Please try again in a few moments, or contact support if the problem persists.'
        }
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !session?._id) return;

    // Add user message locally
    const userMessage: ConversationMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Capture current state for API call to prevent stale closures
      const currentCompletedSections = [...completedSections];
      const currentFinalizedSections = [...finalizedSections];
      const currentSectionValue = currentSection;
      
      // Send message to API with metadata about section progress
      const response = await axios.post(`/api/ai-drafting/${session._id}/message`, {
        message: input,
        metadata: {
          patentProgress: {
            completedSections: currentCompletedSections,
            finalizedSections: currentFinalizedSections,
            currentSection: currentSectionValue
          }
        }
      }, { headers });
      
      // Update messages with API response
      setMessages(response.data.conversation_history);
      setIsLoading(false);
      
      // If we have updated metadata in the response, use it
      if (response.data.metadata?.patentProgress) {
        const responseCompletedSections = response.data.metadata.patentProgress.completedSections || [];
        const responseFinalizedSections = response.data.metadata.patentProgress.finalizedSections || [];
        const responseCurrentSection = response.data.metadata.patentProgress.currentSection || null;
        
        setCompletedSections(responseCompletedSections);
        setCurrentSection(responseCurrentSection);
        setFinalizedSections(responseFinalizedSections);
        
        // We don't need to manually update the draft preview here as the useEffect will handle it
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to send message';
      setError(`Error: ${errorMessage}. Please try again.`);
      setIsLoading(false);
      
      // Add a fallback error response to continue the conversation
      const errorResponseMessage: ConversationMessage = {
        role: 'assistant',
        content: "I'm sorry, there was an error processing your message. Please try again or rephrase your question."
      };
      setMessages([...updatedMessages, errorResponseMessage]);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      recognition.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      recognition.current?.start();
      setIsRecording(true);
      setError(null);
    }
  };

  const generateDocument = async () => {
    if (!session?._id) return;
    
    setIsGeneratingDocument(true);
    setError(null);
    
    try {
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.post(`/api/ai-drafting/${session._id}/generate-draft`, {}, { headers });
      
      // Update session status
      setSession({
        ...session,
        status: 'completed',
        draft_content: response.data.draft_content,
        document_data: response.data.document_data
      });
      
      // Show success message
      const successMessage: ConversationMessage = {
        role: 'assistant',
        content: `✅ Your document has been generated successfully! You used ${response.data.credits_used} credits.`
      };

      // Create a new array instead of modifying the existing one
      const updatedMessages = [...messages, successMessage];
      setMessages(updatedMessages);
      
      // Call callback if provided
      if (onDocumentGenerated) {
        onDocumentGenerated(response.data.document_id);
      }
      
      setIsGeneratingDocument(false);
    } catch (err: any) {
      console.error('Failed to generate document:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to generate document';
      setError(`Error: ${errorMessage}. Please try again later.`);
      setIsGeneratingDocument(false);
      
      // Add a fallback error message
      const errorResponseMessage: ConversationMessage = {
        role: 'assistant',
        content: "I apologize, but there was an error generating your document. This could be due to connection issues or server problems. Please try again in a few moments."
      };
      const updatedErrorMessages = [...messages, errorResponseMessage];
      setMessages(updatedErrorMessages);
    }
  };

  const analyzePatentConversation = (messages: ConversationMessage[]) => {
    // Convert messages to a single string for analysis
    const conversationText = messages
      .filter(m => m.role !== 'system')
      .map(m => m.content)
      .join(' ');
    
    // Get sections data from utils function
    const analysis = analyzeSections(conversationText);
    
    // Update state in parent component
    setCompletedSections(analysis.completed);
    setCurrentSection(analysis.currentSection);
    setFinalizedSections(analysis.finalizedSections || []);
    
    // Update draft preview and handle typing effect separately
    const sectionForTypingEffect = updateDraftPreview(
      analysis.completed, 
      analysis.finalizedSections || [], 
      messages
    );
    
    // Return the section that should get typing effect (if any)
    return sectionForTypingEffect;
  };
  
  // Function to update draft preview with real-time content
  const updateDraftPreview = (
    completed: string[], 
    finalized: string[], 
    messages: ConversationMessage[]
  ) => {
    const newDraftPreview: Record<string, string> = {...draftPreview};
    let newSectionForTypingEffect: string | null = null;
    
    // For each section, extract relevant content from messages
    PATENT_SECTIONS.forEach(section => {
      const isFinalized = finalized.includes(section.id);
      const isComplete = completed.includes(section.id);
      const isCurrentlyEditing = currentSection === section.id;
      
      // If section is finalized, look for the content right before finalization
      if (isFinalized) {
        // First check if we already have content for this section
        if (draftPreview[section.id] && !draftPreview[section.id].includes("PROCESSING")) {
          // Keep existing content for finalized sections 
          newDraftPreview[section.id] = draftPreview[section.id];
          return;
        }
        
        // Check for structured content format in assistant messages
        const structuredContentIndex = messages.findIndex(msg => 
          msg.role === 'assistant' && 
          msg.content.startsWith(`section: "${section.name}"`) ||
          msg.content.includes(`section: "${section.name}"`)
        );
        
        if (structuredContentIndex !== -1) {
          // Extract content from structured format
          const structuredMsg = messages[structuredContentIndex].content;
          const contentMatch = structuredMsg.match(/content: "([^"]*)"/);
          
          if (contentMatch && contentMatch[1]) {
            const cleanContent = contentMatch[1].trim();
            newDraftPreview[section.id] = cleanContent;
            
            // Trigger typing effect for new content
            if (draftPreview[section.id] !== newDraftPreview[section.id]) {
              newSectionForTypingEffect = section.id;
            }
            return;
          }
        }
        
        // Fallback: Look for finalization messages for this section
        const finalizationIndex = messages.findIndex(msg => 
          msg.role === 'user' && 
          msg.content.toLowerCase().includes('finalize') &&
          (
            msg.content.toLowerCase().includes(section.id) ||
            msg.content.toLowerCase().includes(section.name.toLowerCase())
          )
        );
        
        if (finalizationIndex > 0 && finalizationIndex < messages.length - 1) {
          // Look for the assistant response after the finalization request
          const assistantResponseIndex = finalizationIndex + 1;
          
          if (assistantResponseIndex < messages.length && 
              messages[assistantResponseIndex].role === 'assistant') {
            
            const assistantResponse = messages[assistantResponseIndex].content;
            
            // Check if it has our structured format
            const contentMatch = assistantResponse.match(/content: "([^"]*)"/);
            
            if (contentMatch && contentMatch[1]) {
              // We found the structured content format
              const cleanContent = contentMatch[1].trim();
              newDraftPreview[section.id] = cleanContent;
            } else {
              // If not in structured format, temporary placeholder
              newDraftPreview[section.id] = "PROCESSING FINALIZED CONTENT...";
            }
            
            // Trigger typing effect for new content
            if (draftPreview[section.id] !== newDraftPreview[section.id]) {
              newSectionForTypingEffect = section.id;
            }
            
            return;
          }
        }
      }
      
      // Only update sections that are complete, current, or finalized
      if (isComplete || isCurrentlyEditing || isFinalized) {
        // Find messages related to this section
        const sectionMessages = messages.filter(msg => 
          msg.role !== 'system' && 
          (msg.content.toLowerCase().includes(section.id) || 
           msg.content.toLowerCase().includes(section.name.toLowerCase()) ||
           msg.content.toLowerCase().includes(section.description.toLowerCase().substring(0, 15)))
        );
        
        if (sectionMessages.length > 0) {
          // Extract content from the assistant's messages
          const assistantMessages = sectionMessages.filter(msg => msg.role === 'assistant');
          
          if (assistantMessages.length > 0) {
            // Use the most recent assistant message for this section
            const latestMessage = assistantMessages[assistantMessages.length - 1];
            
            // Check for structured format first
            const contentMatch = latestMessage.content.match(/content: "([^"]*)"/);
            
            if (contentMatch && contentMatch[1]) {
              // We found structured content
              newDraftPreview[section.id] = contentMatch[1].trim();
            } else {
              // Clean up the content by removing asterisks and add section formatting
              const content = latestMessage.content
                .replace(/\*\*/g, '') // Remove bold formatting
                .replace(/\*/g, '')   // Remove italic formatting
                .replace(/\?(\s*)$/g, '') // Remove questions at the end
                .replace(/^I'll help you create .*/g, '') // Remove standard opening phrases
                .replace(/^Let's continue .*/g, '')
                .replace(/^Now, let's work on .*/g, '')
                .replace(/^Let me guide you .*/g, '')
                .trim();
              
              // Only update content if it's substantive (not a short question)
              if (content.length > 50 || isFinalized) {
                newDraftPreview[section.id] = content;
              }
            }
            
            // Track if this is new content that needs typing effect
            if (!draftPreview[section.id] && (section.id === currentSection || isFinalized)) {
              newSectionForTypingEffect = section.id;
            }
          }
        }
      }
    });
    
    // Update the draft preview state
    setDraftPreview(newDraftPreview);
    
    // Return the section that should get typing effect (if any)
    return newSectionForTypingEffect;
  };
  
  // Render the messages (left side)
  const renderMessage = (message: ConversationMessage, index: number) => {
    if (message.role === 'system') return null;
    
    const isUser = message.role === 'user';
    
    return (
      <div 
        key={index} 
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div 
          className={`max-w-3/4 rounded-lg px-4 py-2 ${
            isUser 
              ? 'bg-blue-600 text-white rounded-br-none' 
              : 'bg-gray-200 text-gray-800 rounded-bl-none'
          }`}
        >
          {message.content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < message.content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };
  
  // Render progress indicator for patent application
  const renderPatentProgress = () => {
    if (session?.document_type !== 'patent-application') return null;
    
    // Calculate progress percentage - give more weight to finalized sections
    const progress = ((completedSections.length * 0.3) + (finalizedSections.length * 0.7)) / PATENT_SECTIONS.length * 100;
    
    return (
      <div className="p-4 bg-[#181c42] border-b border-[#242966]">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-white text-sm font-medium">Patent Progress</h4>
          <span className="text-xs text-blue-400">
            {finalizedSections.length} finalized / {completedSections.length} in progress / {PATENT_SECTIONS.length} total
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-[#242966] rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-blue-600 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {PATENT_SECTIONS.map(section => {
            const isFinalized = finalizedSections.includes(section.id);
            const isComplete = completedSections.includes(section.id) && !isFinalized;
            const isCurrent = currentSection === section.id && !isFinalized;
            
            return (
              <div 
                key={section.id}
                className={`p-2 rounded text-xs ${
                  isFinalized 
                    ? 'bg-green-900/50 text-green-400 border border-green-500/50 cursor-pointer' :
                  isComplete 
                    ? 'bg-green-900/30 text-green-400 border border-green-500/30 cursor-pointer' : 
                  isCurrent 
                    ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30 cursor-pointer'
                    : 'bg-[#242966]/30 text-gray-400 border border-[#242966]/30 cursor-pointer'
                }`}
                title={section.description}
                onClick={() => {
                  if (section.id) {
                    const prompt = getPromptsForSection(section.id)[0] || `Let's work on the ${section.name} section.`;
                    setInput(prompt);
                  }
                }}
              >
                {isFinalized ? '✓✓ ' : isComplete ? '✓ ' : isCurrent ? '→ ' : ''}{section.name}
              </div>
            );
          })}
        </div>
        
        {/* Show finalize button when appropriate */}
        {showFinalizeButton && currentSection && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={finalizeCurrentSection}
              className="bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Finalize {getSectionById(currentSection)?.name || currentSection} section
            </button>
          </div>
        )}
        
        {/* Quick Prompt Suggestions for Current Section */}
        {currentSection && !finalizedSections.includes(currentSection) && (
          <div className="mt-4">
            <h5 className="text-blue-400 text-xs font-medium mb-2">
              Quick Prompts for {getSectionById(currentSection)?.name}
            </h5>
            <div className="flex flex-wrap gap-2">
              {getPromptsForSection(currentSection).map((prompt, index) => (
                <button
                  key={index}
                  className="text-xs bg-[#242966] hover:bg-[#2e3580] text-gray-300 py-1 px-2 rounded-full transition-colors"
                  onClick={() => {
                    setInput(prompt);
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Function to render the real-time draft preview (right side)
  const renderDraftPreview = () => {
    if (session?.document_type !== 'patent-application') return null;
    
    return (
      <div className="bg-[#14162e] h-full flex flex-col">
        <div className="p-4 bg-[#181c42] border-b border-[#242966] flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-white font-medium flex items-center">
            <FaFileAlt className="mr-2" /> 
            Real-time Patent Draft Preview
          </h3>
          
          {session?.status === 'in_progress' && messages.length > 2 && (
            <button
              onClick={generateDocument}
              disabled={isGeneratingDocument}
              className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded-lg flex items-center space-x-1"
            >
              {isGeneratingDocument ? (
                <>
                  <FaSpinner className="animate-spin mr-1" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FaFileAlt className="mr-1" />
                  <span>Generate Document</span>
                </>
              )}
            </button>
          )}
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto" style={{ height: "calc(100% - 60px)" }}>
          {PATENT_SECTIONS.map(section => {
            const isComplete = completedSections.includes(section.id);
            const isFinalized = finalizedSections.includes(section.id);
            const isCurrentlyEditing = currentSection === section.id;
            const hasContent = draftPreview[section.id];
            
            return (
              <div key={section.id} className="mb-6" id={`section-${section.id}`}>
                <h4 className={`text-md font-semibold mb-2 ${
                  isFinalized ? 'text-green-500' : 
                  isComplete ? 'text-green-400' : 
                  isCurrentlyEditing ? 'text-blue-400' : 
                  'text-gray-500'
                }`}>
                  {section.name}
                  {isFinalized && <span className="ml-2 text-green-500">✓ Finalized</span>}
                  {isComplete && !isFinalized && <span className="ml-2 text-green-400">✓</span>}
                  {isCurrentlyEditing && !isComplete && !isFinalized && <span className="ml-2 text-blue-400">(in progress)</span>}
                </h4>
                
                {hasContent ? (
                  <div className={`text-sm border-l-2 pl-3 ${
                    isFinalized ? 'border-green-600 text-white bg-green-900/20 px-2 py-1 rounded-r-sm' : 
                    isComplete ? 'border-green-500 text-gray-300' : 
                    isCurrentlyEditing ? 'border-blue-500 text-gray-300' : 
                    'border-gray-600 text-gray-400'
                  }`}>
                    <p className={`${typingEffect && typingSection === section.id ? 'typing-effect' : ''}`}>
                      {draftPreview[section.id]}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic border-l-2 border-gray-600 pl-3">
                    {isCurrentlyEditing ? 'Currently working on this section...' : 'Not yet started'}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Section navigation */}
          <div className="fixed bottom-8 right-8 bg-[#181c42] p-2 rounded-lg shadow-lg border border-[#242966]">
            <div className="text-xs text-gray-400 mb-1">Jump to section:</div>
            <div className="flex flex-col space-y-1">
              {PATENT_SECTIONS.map(section => (
                <button
                  key={section.id}
                  onClick={() => {
                    document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`text-xs px-2 py-1 rounded text-left ${
                    finalizedSections.includes(section.id) 
                      ? 'text-green-500 hover:bg-[#242966]' :
                    completedSections.includes(section.id) 
                      ? 'text-green-400 hover:bg-[#242966]' : 
                    currentSection === section.id 
                      ? 'text-blue-400 hover:bg-[#242966]'
                      : 'text-gray-400 hover:bg-[#242966]'
                  }`}
                >
                  {finalizedSections.includes(section.id) ? '✓✓ ' : 
                    completedSections.includes(section.id) ? '✓ ' : 
                    currentSection === section.id ? '→ ' : ''}
                  {section.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Add fetchGuidelinesForSection function (commented out database connection)
  const fetchGuidelinesForSection = async (section: string) => {
    try {
      setIsLoadingGuidelines(true);
      
      // Use the App Router API endpoint
      /* 
      // Database connection is not being used anymore
      const response = await fetch(`/api/patent-guidelines?section=${section}`);
      
      console.log(`API Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`Error response: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error details: ${errorText}`);
        throw new Error(`Failed to fetch guidelines: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received guidelines data:', data);
      
      setSectionGuidelines(data.guidelines || []);
      */
      
      // Use hardcoded guidelines instead (since database connection is not used anymore)
      const section_obj = getSectionById(section);
      if (section_obj) {
        const mockGuidelines = [{
          _id: section,
          section: section,
          title: section_obj.name,
          content: section_obj.description,
          order: 1,
          tips: section_obj.tips
        }];
        setSectionGuidelines(mockGuidelines);
      }
    } catch (error) {
      console.error('Error fetching section guidelines:', error);
      // Set empty guidelines to avoid showing loading state indefinitely
      setSectionGuidelines([]);
    } finally {
      setIsLoadingGuidelines(false);
    }
  };

  // Render the guidelines sidebar
  const renderGuidelines = () => {
    if (session?.document_type !== 'patent-application' || !currentSection) return null;
    
    const section = getSectionById(currentSection);
    
    return (
      <div className="bg-[#14162e] border-l border-[#242966] absolute right-0 top-0 bottom-0 w-1/3 flex flex-col overflow-hidden z-10">
        <div className="p-4 bg-[#181c42] border-b border-[#242966] flex justify-between items-center">
          <div>
            <h3 className="text-white font-medium flex items-center">
              <BsInfoCircle className="mr-2" />
              Guidelines: {section?.name}
            </h3>
          </div>
          <button 
            className="text-gray-400 hover:text-white"
            onClick={() => setShowGuidelines(false)}
            aria-label="Toggle guidelines"
          >
            <FiX size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {/* Section Tips from our utility */}
          {section && (
            <div className="mb-6">
              <h4 className="text-blue-400 font-medium mb-2 flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  section.importance === 'high' ? 'bg-red-500' : 
                  section.importance === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></span>
                Section Tips
                <span className="ml-2 text-xs opacity-70">
                  ({section.importance} importance)
                </span>
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-300 text-sm">
                {section.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Database Guidelines */}
          {isLoadingGuidelines ? (
            <div className="flex justify-center items-center h-full">
              <AiOutlineLoading3Quarters className="animate-spin text-blue-500" size={24} />
            </div>
          ) : sectionGuidelines.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-blue-400 font-medium mb-2">Reference Guidelines</h4>
              {sectionGuidelines.map(guideline => (
                <div key={guideline._id} className="bg-[#1a1d43] p-4 rounded border border-[#242966]">
                  <h4 className="text-blue-400 font-medium mb-2">{guideline.title}</h4>
                  <div className="text-gray-300 text-sm whitespace-pre-line">
                    {guideline.content}
                  </div>
                  
                  {/* Display examples if available */}
                  {guideline.examples && guideline.examples.length > 0 && (
                    <div className="mt-2">
                      <h5 className="text-green-400 text-xs font-medium mb-1">Examples:</h5>
                      <ul className="list-disc text-gray-300 text-xs pl-4">
                        {guideline.examples.map((example, i) => (
                          <li key={i} className="mb-1">{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Display tips if available */}
                  {guideline.tips && guideline.tips.length > 0 && (
                    <div className="mt-2">
                      <h5 className="text-blue-400 text-xs font-medium mb-1">Tips:</h5>
                      <ul className="list-disc text-gray-300 text-xs pl-4">
                        {guideline.tips.map((tip, i) => (
                          <li key={i} className="mb-1">{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center p-4">
              No additional guidelines available for this section.
            </div>
          )}
        </div>
      </div>
    );
  };

  // Add a function to finalize the current section
  const finalizeCurrentSection = async () => {
    if (!currentSection || !session?._id) return;
    
    // First update the local state
    const updatedFinalizedSections = [...finalizedSections, currentSection];
    
    setFinalizedSections(updatedFinalizedSections);
    setShowFinalizeButton(false);
    
    try {
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Get a helpful summary message about the finalized section
      const sectionName = getSectionById(currentSection)?.name || currentSection;
      const userMessage: ConversationMessage = { 
        role: 'user', 
        content: `I'm ready to finalize the ${sectionName} section and move on.` 
      };
      
      // Add message to local state temporarily
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);
      
      // Calculate the next section to work on
      const nextSectionToWorkOn = getNextIncompleteSection(updatedFinalizedSections);
      
      // Send message to API
      const response = await axios.post(`/api/ai-drafting/${session._id}/message`, {
        message: userMessage.content,
        metadata: {
          patentProgress: {
            completedSections: completedSections,
            finalizedSections: updatedFinalizedSections,
            currentSection: nextSectionToWorkOn
          }
        }
      }, { headers });
      
      // Update with API response
      setMessages(response.data.conversation_history);
      setIsLoading(false);
      
      // Force an update to the draft preview with the finalized content
      if (response.data.metadata?.patentProgress) {
        const responseCompletedSections = response.data.metadata.patentProgress.completedSections || [];
        const responseFinalizedSections = response.data.metadata.patentProgress.finalizedSections || [];
        const responseCurrentSection = response.data.metadata.patentProgress.currentSection || null;
        
        setCompletedSections(responseCompletedSections);
        setCurrentSection(responseCurrentSection);
        setFinalizedSections(responseFinalizedSections);
        
        // Update draft preview without causing an infinite loop
        const sectionWithNewContent = updateDraftPreview(
          responseCompletedSections,
          responseFinalizedSections,
          response.data.conversation_history
        );
        
        // Apply typing effect for the newly finalized section
        if (sectionWithNewContent) {
          setTypingEffect(true);
          setTypingSection(sectionWithNewContent);
          
          // Clear typing effect after 2 seconds
          setTimeout(() => {
            setTypingEffect(false);
            setTypingSection(null);
          }, 2000);
        }
      }
    } catch (err: any) {
      console.error('Failed to finalize section:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to finalize section';
      setError(`Error: ${errorMessage}. Please try again.`);
      setIsLoading(false);
    }
  };

  // Helper function to get the next incomplete section
  const getNextIncompleteSection = (finalized: string[]): string | null => {
    for (const section of PATENT_SECTIONS) {
      if (!finalized.includes(section.id)) {
        return section.id;
      }
    }
    return null;
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
        <span className="ml-2 text-gray-600">Loading conversation...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back to Documents link */}
      <div className="px-4 py-2 mb-3">
        <Link href="/documents" className="text-blue-400 hover:text-blue-300 flex items-center text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Documents
        </Link>
      </div>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e0b35] to-[#0c0c2b] text-white p-4 border-b">
        <h2 className="text-lg font-semibold">
          {session?.document_type 
            ? `${session.document_type.charAt(0).toUpperCase() + session.document_type.slice(1).replace(/-/g, ' ')} Document Drafting` 
            : 'Document Drafting'}
        </h2>
        {session?.status === 'in_progress' && (
          <p className="text-sm text-gray-300">
            Tell me about your document requirements and I'll help you create it
          </p>
        )}
        {session?.status === 'completed' && (
          <p className="text-sm text-green-400">
            Your document has been created successfully
          </p>
        )}
      </div>

      {/* Split View Container - Always show chat on left and draft on right */}
      <div className="flex flex-1 overflow-hidden gap-3 p-3">
        {/* Chat Panel - Left Side - 50% */}
        <div className="w-1/2 flex flex-col h-full overflow-hidden bg-[#0d0f29] relative rounded-lg">
          {/* Patent Progress (if applicable) */}
          {session?.document_type === 'patent-application' && renderPatentProgress()}
          
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <p>Start your conversation with the AI to create your document</p>
              </div>
            )}
            
            {messages.map((message, index) => renderMessage(message, index))}
            
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-[#242966] text-white rounded-lg px-4 py-2 rounded-bl-none">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce delay-75"></div>
                    <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef}></div>
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t border-[#242966]">
            {error && (
              <div className="mb-3 p-2 bg-red-900/30 text-red-400 rounded text-sm">
                {error}
              </div>
            )}
            
            {session?.status === 'in_progress' ? (
              <div className="flex flex-col space-y-4">
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      className="w-full bg-[#181c42] text-white border border-[#242966] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#a78bfa] resize-none"
                      rows={2}
                    ></textarea>
                  </div>
                  
                  <button
                    onClick={toggleRecording}
                    className={`p-2 rounded-lg ${
                      isRecording ? 'bg-red-600 text-white' : 'bg-[#181c42] text-white hover:bg-[#242966]'
                    }`}
                  >
                    {isRecording ? <FaMicrophoneSlash /> : <FaMicrophone />}
                  </button>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-[#a78bfa] hover:bg-[#8b5cf6] text-white rounded-lg disabled:opacity-50"
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 text-green-400">
                Document generation completed
              </div>
            )}
          </div>

          {/* Guidelines button */}
          {session?.document_type === 'patent-application' && currentSection && (
            <button
              onClick={() => setShowGuidelines(!showGuidelines)}
              className="absolute top-16 right-4 p-2 bg-[#242966] hover:bg-[#2e3580] text-white rounded-full"
              title="View Guidelines"
            >
              <BsInfoCircle size={18} />
            </button>
          )}
        </div>
        
        {/* Real-time Draft Preview - Right Side - 50% */}
        <div className="w-1/2 bg-[#0d0f29] h-full overflow-hidden rounded-lg">
          <div className="bg-[#14162e] h-full flex flex-col">
            <div className="p-4 bg-[#181c42] border-b border-[#242966] flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-white font-medium flex items-center">
                <FaFileAlt className="mr-2" /> 
                Real-time Patent Draft Preview
              </h3>
              
              {session?.status === 'in_progress' && messages.length > 2 && (
                <button
                  onClick={generateDocument}
                  disabled={isGeneratingDocument}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded-lg flex items-center space-x-1"
                >
                  {isGeneratingDocument ? (
                    <>
                      <FaSpinner className="animate-spin mr-1" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <FaFileAlt className="mr-1" />
                      <span>Generate Document</span>
                    </>
                  )}
                </button>
              )}
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto" style={{ height: "calc(100% - 60px)" }}>
              {PATENT_SECTIONS.map(section => {
                const isComplete = completedSections.includes(section.id);
                const isFinalized = finalizedSections.includes(section.id);
                const isCurrentlyEditing = currentSection === section.id;
                const hasContent = draftPreview[section.id];
                
                return (
                  <div key={section.id} className="mb-6" id={`section-${section.id}`}>
                    <h4 className={`text-md font-semibold mb-2 ${
                      isFinalized ? 'text-green-500' : 
                      isComplete ? 'text-green-400' : 
                      isCurrentlyEditing ? 'text-blue-400' : 
                      'text-gray-500'
                    }`}>
                      {section.name}
                      {isFinalized && <span className="ml-2 text-green-500">✓ Finalized</span>}
                      {isComplete && !isFinalized && <span className="ml-2 text-green-400">✓</span>}
                      {isCurrentlyEditing && !isComplete && !isFinalized && <span className="ml-2 text-blue-400">(in progress)</span>}
                    </h4>
                    
                    {hasContent ? (
                      <div className={`text-sm border-l-2 pl-3 ${
                        isFinalized ? 'border-green-600 text-white bg-green-900/20 px-2 py-1 rounded-r-sm' : 
                        isComplete ? 'border-green-500 text-gray-300' : 
                        isCurrentlyEditing ? 'border-blue-500 text-gray-300' : 
                        'border-gray-600 text-gray-400'
                      }`}>
                        <p className={`${typingEffect && typingSection === section.id ? 'typing-effect' : ''}`}>
                          {draftPreview[section.id]}
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic border-l-2 border-gray-600 pl-3">
                        {isCurrentlyEditing ? 'Currently working on this section...' : 'Not yet started'}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Section navigation */}
              <div className="fixed bottom-8 right-8 bg-[#181c42] p-2 rounded-lg shadow-lg border border-[#242966]">
                <div className="text-xs text-gray-400 mb-1">Jump to section:</div>
                <div className="flex flex-col space-y-1">
                  {PATENT_SECTIONS.map(section => (
                    <button
                      key={section.id}
                      onClick={() => {
                        document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`text-xs px-2 py-1 rounded text-left ${
                        finalizedSections.includes(section.id) 
                          ? 'text-green-500 hover:bg-[#242966]' :
                        completedSections.includes(section.id) 
                          ? 'text-green-400 hover:bg-[#242966]' : 
                        currentSection === section.id 
                          ? 'text-blue-400 hover:bg-[#242966]'
                          : 'text-gray-400 hover:bg-[#242966]'
                      }`}
                    >
                      {finalizedSections.includes(section.id) ? '✓✓ ' : 
                        completedSections.includes(section.id) ? '✓ ' : 
                        currentSection === section.id ? '→ ' : ''}
                      {section.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Guidelines Sidebar (overlay when active) */}
        {showGuidelines && renderGuidelines()}
      </div>
      
      {/* Add CSS for typing effect */}
      <style jsx global>{`
        .typing-effect {
          overflow: hidden;
          border-right: .15em solid #3b82f6;
          white-space: normal;
          animation: typing 3.5s steps(40, end),
                     blink-caret .75s step-end infinite;
        }
        
        @keyframes typing {
          from { max-height: 0 }
          to { max-height: 1000px }
        }
        
        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: #3b82f6 }
        }
      `}</style>
    </div>
  );
};

export default AIDraftingChat; 