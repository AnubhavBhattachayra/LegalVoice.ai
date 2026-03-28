'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  FaRobot, 
  FaUser, 
  FaPaperPlane, 
  FaFileUpload, 
  FaMicrophone, 
  FaStopCircle,
  FaDownload,
  FaEllipsisV,
  FaSyncAlt,
  FaLightbulb,
  FaHistory,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaPlus
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

// Message type definition
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  attachments?: {
    name: string;
    type: string;
    size: number;
    url: string;
  }[];
}

interface ChatSession {
  id: string;
  title: string;
  date: string;
  preview: string;
}

// Example suggested questions
const suggestedQuestions = [
  'What are the key elements of a valid contract?',
  'How do I respond to a legal notice?',
  'Explain non-disclosure agreements in simple terms',
  'What are my rights as a tenant?',
  'How do I register a trademark?'
];

// Countries list
const countries = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'SG', name: 'Singapore' },
  // Add more countries as needed
];

// Languages list
const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  // Add more languages as needed
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI legal assistant. How can I help you today? You can ask me about legal documents, procedures, or general legal questions.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showDocumentSuggestion, setShowDocumentSuggestion] = useState(false);
  const [suggestedDocument, setSuggestedDocument] = useState<{type: string, confidence: number} | null>(null);
  const [showUploadArea, setShowUploadArea] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Auto-scroll to top of chat container on initial load
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }
  }, []);

  // Auto-scroll to bottom of messages only when new messages are added
  useEffect(() => {
    if (messages.length > 1) { // Only auto-scroll when there are actual messages beyond the initial greeting
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fetch chat history on component mount
  useEffect(() => {
    fetchChatHistory();
    
    // Check for an initial query from the home page
    if (typeof window !== 'undefined') {
      const initialQuery = localStorage.getItem('initialChatQuery');
      if (initialQuery) {
        setInput(initialQuery);
        // Clear the stored query to prevent it from being used again
        localStorage.removeItem('initialChatQuery');
        
        // Create a local function to handle sending the initial message
        const sendInitialMessage = async () => {
          // Only proceed if the input is still set (avoid race conditions)
          if (initialQuery) {
            const userMessage: Message = {
              id: Date.now().toString(),
              role: 'user',
              content: initialQuery,
              timestamp: new Date(),
            };
            
            // Add user message to chat
            setMessages(prev => [...prev, userMessage]);
            
            // Add loading message from assistant
            const loadingMessage: Message = {
              id: `loading-${Date.now()}`,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              isLoading: true
            };
            
            setMessages(prev => [...prev, loadingMessage]);
            
            try {
              // Send message to backend API
              const response = await axios.post('/api/chat', {
                message: initialQuery,
                sessionId: currentSessionId,
                country: selectedCountry,
                language: selectedLanguage
              });
              
              // Remove loading message
              setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
              
              if (response.data.success) {
                // If this is a new conversation, set the session ID
                if (!currentSessionId && response.data.sessionId) {
                  setCurrentSessionId(response.data.sessionId);
                  // Refresh chat history
                  fetchChatHistory();
                }
                
                // Add AI response
                const aiResponse: Message = {
                  id: `ai-${Date.now()}`,
                  role: 'assistant',
                  content: response.data.reply,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, aiResponse]);
                
                // Check for document suggestion
                if (response.data.metadata?.suggestedDocument) {
                  setSuggestedDocument(response.data.metadata.suggestedDocument);
                  setShowDocumentSuggestion(true);
                }
                
                // Update country and language if provided
                if (response.data.metadata?.country) {
                  const countryCode = countries.find(c => c.name.toLowerCase() === response.data.metadata.country.toLowerCase())?.code;
                  if (countryCode) setSelectedCountry(countryCode);
                }
                
                if (response.data.metadata?.language) {
                  setSelectedLanguage(response.data.metadata.language);
                }
              } else {
                throw new Error(response.data.message || 'Failed to get response');
              }
            } catch (error) {
              console.error('Error sending message:', error);
              // Remove loading message
              setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
              
              // Add error message
              const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: "I'm sorry, I couldn't process your request. Please try again later.",
                timestamp: new Date()
              };
              setMessages(prev => [...prev, errorMessage]);
              toast.error('Error communicating with AI service');
            }
            
            // Clear input after sending
            setInput('');
          }
        };
        
        // Auto-submit after a short delay to allow the component to fully mount
        setTimeout(() => {
          sendInitialMessage();
        }, 500);
      }
    }
  }, []);

  const fetchChatHistory = async () => {
    try {
      console.log('Fetching chat history...');
      
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get('/api/chat/sessions', { headers });
      console.log('Chat history response:', response.data);
      if (response.data.success) {
        setChatHistory(response.data.data.sessions);
        console.log('Chat history set:', response.data.data.sessions);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      // Don't show error toast on initial load
      // Set empty chat history
      setChatHistory([]);
    }
  };

  const fetchChatSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`/api/chat/sessions/${sessionId}`, { headers });
      if (response.data.success) {
        // Transform backend messages to our frontend format
        const sessionMessages = response.data.messages.map((msg: any) => ({
          id: msg._id,
          role: msg.sender,
          content: msg.message,
          timestamp: new Date(msg.createdAt),
          attachments: msg.attachments
        }));
        setMessages(sessionMessages);
        setCurrentSessionId(sessionId);
      }
    } catch (error: any) {
      console.error('Error fetching chat session:', error);
      // Check if it's an auth error and handle silently
      if (error.response?.status === 401) {
        // Auth error - just start a new chat
        startNewChat();
      } else {
        toast.error('Failed to load chat session');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '' && uploadedFiles.length === 0) return;

    // Check if user is requesting document drafting
    const documentRequestRegex = /\b(draft|write|create|design|prepare|make)\s+(a|an|the)?\s+(document|patent|agreement|contract|will|notice|application|deed)\b/i;
    const isDocumentRequest = documentRequestRegex.test(input.toLowerCase());
    
    // Check specifically for patent related requests
    const patentRequestRegex = /\b(patent|invention|patenting|patent application)\b/i;
    const isPatentRequest = isDocumentRequest && patentRequestRegex.test(input.toLowerCase());
    
    // Create new user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: uploadedFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file) // Will be replaced with actual URL after upload
      }))
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input and uploaded files
    setInput('');

    // Add loading message from assistant
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, loadingMessage]);
    setShowDocumentSuggestion(false);
    
    // Hide file uploader if it was showing
    setShowUploadArea(false);

    try {
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Handle file uploads first if any
      let attachments = [];
      if (uploadedFiles.length > 0) {
        attachments = await uploadFiles(uploadedFiles);
        setUploadedFiles([]);
      }

      // Send message to backend API
      const response = await axios.post('/api/chat', {
        message: input,
        sessionId: currentSessionId,
        attachments: attachments.length > 0 ? attachments : undefined,
        country: selectedCountry,
        language: selectedLanguage
      }, { headers });

      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
      
      if (response.data.success) {
        // If this is a new conversation, set the session ID
        if (!currentSessionId && response.data.sessionId) {
          console.log('Setting new session ID:', response.data.sessionId);
          setCurrentSessionId(response.data.sessionId);
          // Refresh chat history
          fetchChatHistory();
        }
        
        // Add AI response
        const aiResponse: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: response.data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
        
        // Always refresh chat history to update titles and session list
        fetchChatHistory();
        
        // Check for document suggestion
        if (response.data.metadata?.suggestedDocument) {
          setSuggestedDocument(response.data.metadata.suggestedDocument);
          setShowDocumentSuggestion(true);
        }
        
        // Update country and language if provided in the response
        if (response.data.metadata?.country) {
          const countryCode = countries.find(c => c.name.toLowerCase() === response.data.metadata.country.toLowerCase())?.code;
          if (countryCode) setSelectedCountry(countryCode);
        }
        
        if (response.data.metadata?.language) {
          setSelectedLanguage(response.data.metadata.language);
        }
        
        // If this was a document request, redirect to document drafting page
        if (isDocumentRequest) {
          // Add a message explaining we're redirecting the user
          const redirectMessage: Message = {
            id: `redirect-${Date.now()}`,
            role: 'assistant',
            content: isPatentRequest 
              ? "I'll help you draft a patent application. Redirecting you to our dedicated patent drafting interface..."
              : "I'll help you create that document. Redirecting you to our document drafting interface...",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, redirectMessage]);
          
          // Wait 2 seconds for the user to read the message
          setTimeout(() => {
            if (isPatentRequest) {
              router.push(`/documents/draft?type=patent-application&session_id=new&prompt=${encodeURIComponent(input)}`);
            } else {
              router.push(`/documents/draft?prompt=${encodeURIComponent(input)}`);
            }
          }, 2000);
        }
      } else {
        throw new Error(response.data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
      
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I couldn't process your request. Please try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Error communicating with AI service');
    }
  };

  const uploadFiles = async (files: File[]) => {
    const uploadedAttachments = [];
    setIsProcessingFile(true);
    
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post('/api/chat/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          uploadedAttachments.push({
            fileId: response.data.fileId,
            name: file.name,
            type: file.type,
            url: response.data.fileUrl
          });
        }
      }
      return uploadedAttachments;
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
      return [];
    } finally {
      setIsProcessingFile(false);
    }
  };

  const startNewChat = () => {
    // Clear current messages and session
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your AI legal assistant. How can I help you today? You can ask me about legal documents, procedures, or general legal questions.",
        timestamp: new Date()
      }
    ]);
    setCurrentSessionId(null);
    setShowDocumentSuggestion(false);
    // Close the history sidebar if it's open
    setShowHistory(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const toggleRecording = () => {
    // In a real app, you would implement speech-to-text functionality
    setIsRecording(!isRecording);
    if (isRecording) {
      // Simulate end of recording with text
      setInput(prev => prev + " This is simulated speech-to-text conversion.");
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      setIsRecording(true);
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const audioBlob = new Blob([event.data], { type: 'audio/wav' });
          // In a real app, you would send this to a speech-to-text service
          console.log('Audio recorded, size:', audioBlob.size);
          // Simulate transcription
          setInput(prev => prev + " [Voice input transcribed]");
        }
      };
      
      // Store reference to stop later
      (window as any).currentRecorder = mediaRecorder;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error('Could not access microphone');
    }
  };
  
  const stopRecording = () => {
    if ((window as any).currentRecorder) {
      (window as any).currentRecorder.stop();
      // Stop all tracks
      (window as any).currentRecorder.stream.getTracks().forEach((track: any) => track.stop());
      setIsRecording(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    // Focus the input after setting the value
    const textarea = document.getElementById('chat-input') as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the session from being selected
    
    try {
      const response = await axios.delete(`/api/chat/sessions/${sessionId}`);
      if (response.data.success) {
        toast.success('Chat session deleted');
        // If the deleted session is the current one, start a new chat
        if (sessionId === currentSessionId) {
          startNewChat();
        }
        // Refresh chat history
        fetchChatHistory();
      }
    } catch (error: any) {
      console.error('Error deleting chat session:', error);
      // Check if it's an auth error and handle silently
      if (error.response?.status === 401) {
        // Auth error - just refresh the UI
        startNewChat();
        fetchChatHistory();
      } else {
        toast.error('Failed to delete chat session');
      }
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Add function to navigate to documents page
  const handleCreateDocument = () => {
    if (suggestedDocument) {
      // Save current conversation to localStorage for context
      localStorage.setItem('documentContext', JSON.stringify({
        sessionId: currentSessionId,
        messages: messages,
        documentType: suggestedDocument.type
      }));
      
      // Navigate to documents page
      router.push(`/documents/create?type=${suggestedDocument.type}`);
    }
  };

  return (
    <div className="bg-[#07081a] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Chat History Sidebar */}
          <AnimatePresence>
            {showHistory && (
              <motion.div 
                className="w-full md:w-72 bg-[#0d0f29] shadow-lg rounded-lg overflow-hidden"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <div className="p-4 bg-gradient-to-r from-[#1e0b35] to-[#0c0c2b] text-white">
                  <h3 className="font-bold flex items-center">
                    <FaHistory className="mr-2" /> Chat History
                  </h3>
                </div>
                
                {/* Add New Chat Button */}
                <div className="p-3">
                  <button
                    className="w-full flex items-center justify-center gap-2 bg-[#181c42] hover:bg-[#242966] text-white rounded-lg py-2 transition-colors"
                    onClick={startNewChat}
                  >
                    <FaPlus size={12} /> New Chat
                  </button>
                </div>

                {/* History List */}
                <div className="p-2 space-y-1 max-h-[500px] overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center py-4 text-gray-400">
                      <FaSyncAlt className="animate-spin mx-auto mb-2" />
                      Loading history...
                    </div>
                  ) : chatHistory.length > 0 ? (
                    chatHistory.map((chat) => (
                      <button
                        key={chat.id}
                        className={`w-full text-left p-2 rounded-lg transition-colors ${
                          currentSessionId === chat.id 
                            ? 'bg-[#242966] text-white' 
                            : 'text-gray-300 hover:bg-[#181c42]'
                        }`}
                        onClick={() => fetchChatSession(chat.id)}
                      >
                        <div className="font-medium truncate">{chat.title}</div>
                        <div className="text-xs opacity-70 flex justify-between">
                          <span>{chat.date}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      No chat history found
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-[#0d0f29] rounded-lg shadow-lg overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 bg-gradient-to-r from-[#1e0b35] to-[#0c0c2b] text-white flex justify-between items-center">
              <div className="flex items-center">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="mr-3 hover:bg-[#242966] p-2 rounded-full transition-colors"
                >
                  <FaHistory />
                </button>
                <h2 className="font-bold">Legal Assistant</h2>
              </div>
              <div className="flex space-x-2">
                {/* Country Selector */}
                <select 
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="bg-[#181c42] border border-[#242966] text-white text-sm rounded-lg p-2"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                
                {/* Language Selector */}
                <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-[#181c42] border border-[#242966] text-white text-sm rounded-lg p-2"
                >
                  {languages.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Messages Container */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[600px]"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-[#181c42] text-white rounded-br-none'
                        : 'bg-[#242966] text-white rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      {message.role === 'assistant' ? (
                        <FaRobot className="mr-1 text-[#a78bfa]" size={12} />
                      ) : (
                        <FaUser className="mr-1 text-[#a78bfa]" size={12} />
                      )}
                      <span className="text-xs font-bold">
                        {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                      </span>
                      <span className="text-xs ml-2 opacity-50">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {message.isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="loading-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none text-white whitespace-pre-wrap">
                        {message.content}
                      </div>
                    )}
                    
                    {/* Attachments if any */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment, idx) => (
                          <div key={idx} className="flex items-center bg-[#111330] rounded p-2 text-sm">
                            <span className="truncate flex-1">{attachment.name}</span>
                            <span className="text-xs opacity-60 ml-2">
                              {(attachment.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Document Suggestion Notice */}
            {showDocumentSuggestion && suggestedDocument && (
              <div className="bg-[#181c42] border-t border-[#242966] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[#a78bfa]">
                      <FaLightbulb className="inline mr-2" />
                      Legal document suggested: <strong>{suggestedDocument.type.replace('_', ' ')}</strong>
                    </span>
                  </div>
                  <button
                    onClick={handleCreateDocument}
                    className="bg-[#a78bfa] hover:bg-[#8b5cf6] text-white px-3 py-1 rounded-lg text-sm flex items-center"
                  >
                    <span>Create Document</span>
                  </button>
                </div>
              </div>
            )}

            {/* Show suggestions for new chats */}
            {messages.length <= 1 && showSuggestions && (
              <div className="border-t border-[#242966] p-4">
                <div className="text-sm text-gray-400 mb-2">Suggested questions:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      className="bg-[#181c42] hover:bg-[#242966] text-white rounded-lg p-2 text-sm text-left transition-colors"
                      onClick={() => {
                        setInput(question);
                        setShowSuggestions(false);
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-[#242966] p-4">
              {showUploadArea && (
                <div className="mb-4 bg-[#181c42] rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white">Upload Files</span>
                    <button 
                      onClick={() => setShowUploadArea(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                  
                  <div className="border-2 border-dashed border-[#242966] rounded-lg p-4 text-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                      accept="image/jpeg,image/png,image/jpg,application/pdf,text/plain"
                    />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#242966] hover:bg-[#2e3581] text-white px-4 py-2 rounded-lg inline-flex items-center"
                      disabled={isProcessingFile}
                    >
                      {isProcessingFile ? (
                        <>
                          <FaSyncAlt className="animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FaFileUpload className="mr-2" />
                          Select Files
                        </>
                      )}
                    </button>
                    
                    <p className="text-xs text-gray-400 mt-2">
                      Supported formats: JPEG, PNG, PDF, TXT (Max 10MB)
                    </p>
                  </div>
                  
                  {/* Show uploaded files */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-[#111330] rounded p-2 text-sm">
                          <span className="truncate flex-1">{file.name}</span>
                          <span className="text-xs opacity-60 mr-2">
                            {(file.size / 1024).toFixed(0)} KB
                          </span>
                          <button 
                            onClick={() => removeFile(index)}
                            className="text-gray-400 hover:text-white"
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowUploadArea(!showUploadArea)}
                  className="bg-[#181c42] hover:bg-[#242966] text-white p-2 rounded-lg transition-colors"
                >
                  <FaFileUpload />
                </button>
                
                <div className="relative flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full bg-[#181c42] text-white border border-[#242966] rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-[#a78bfa] resize-none overflow-auto"
                    rows={1}
                    style={{ height: 'auto', maxHeight: '200px', minHeight: '40px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                </div>
                
                <button
                  onClick={() => {
                    if (isRecording) {
                      stopRecording();
                    } else {
                      startRecording();
                    }
                  }}
                  className={`${
                    isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-[#181c42] hover:bg-[#242966]'
                  } text-white p-2 rounded-lg transition-colors`}
                >
                  {isRecording ? <FaStopCircle /> : <FaMicrophone />}
                </button>
                
                <button
                  onClick={handleSendMessage}
                  disabled={input.trim() === '' && uploadedFiles.length === 0}
                  className="bg-[#a78bfa] hover:bg-[#8b5cf6] text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 