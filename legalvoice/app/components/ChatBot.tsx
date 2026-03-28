'use client';

import { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop, FaPaperPlane, FaLanguage } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'document' | 'form' | 'legal_advice' | 'consultation' | 'analysis' | 'translation';
  metadata?: {
    documentType?: string;
    formFields?: Record<string, any>;
    legalTopic?: string;
    suggestedActions?: Array<{
      type: string;
      label: string;
      action: () => void;
    }>;
    confidence?: number;
    source?: string;
    references?: Array<{
      title: string;
      url: string;
    }>;
  };
}

interface ChatState {
  context: {
    currentTopic?: string;
    documentType?: string;
    formType?: string;
    language: string;
    userCredits: number;
  };
  history: Message[];
}

export default function ChatBot() {
  const { user } = useAuth();
  const [chatState, setChatState] = useState<ChatState>({
    context: {
      language: 'en',
      userCredits: 0
    },
    history: []
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await handleVoiceInput(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleVoiceInput = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', selectedLanguage);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Transcription failed');
      
      const { text } = await response.json();
      setInput(text);
      await handleSend(text);
    } catch (error) {
      console.error('Error processing voice input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async (messageText: string = input) => {
    if (!messageText.trim() || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          language: selectedLanguage,
          userId: user?.uid,
          context: chatState.context
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      // Update chat state with new context
      setChatState(prev => ({
        ...prev,
        context: {
          ...prev.context,
          ...data.context
        }
      }));

      // Handle different types of responses
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        type: data.type || 'text',
        metadata: data.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle specific actions based on response type
      if (data.type === 'document') {
        handleDocumentAction(data.metadata);
      } else if (data.type === 'form') {
        handleFormAction(data.metadata);
      } else if (data.type === 'consultation') {
        handleConsultationAction(data.metadata);
      } else if (data.type === 'legal_advice') {
        handleLegalAdviceAction(data.metadata);
      } else if (data.type === 'analysis') {
        handleAnalysisAction(data.metadata);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        type: 'text'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDocumentAction = (metadata: Message['metadata']) => {
    if (metadata?.documentType) {
      // Navigate to document creation page with pre-filled data
      window.location.href = `/documents/create?type=${metadata.documentType}`;
    }
  };

  const handleFormAction = (metadata: Message['metadata']) => {
    if (metadata?.formFields) {
      // Navigate to form filling page with pre-filled data
      window.location.href = `/forms/fill?fields=${encodeURIComponent(JSON.stringify(metadata.formFields))}`;
    }
  };

  const handleConsultationAction = (metadata: Message['metadata']) => {
    if (metadata?.legalTopic) {
      // Navigate to lawyer consultation page with topic
      window.location.href = `/consultations/book?topic=${encodeURIComponent(metadata.legalTopic)}`;
    }
  };

  const handleLegalAdviceAction = (metadata: Message['metadata']) => {
    // Display legal advice with references
    if (metadata?.references) {
      // You can add UI elements to show references
    }
  };

  const handleAnalysisAction = (metadata: Message['metadata']) => {
    if (metadata?.source) {
      // Navigate to document analysis page
      window.location.href = `/analysis?source=${encodeURIComponent(metadata.source)}`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Language Selection */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <FaLanguage className="text-gray-500" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="bn">Bengali</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="mr">Marathi</option>
            <option value="gu">Gujarati</option>
            <option value="kn">Kannada</option>
            <option value="ml">Malayalam</option>
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.type && (
                <span className="text-xs mt-1 block opacity-75">
                  {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
                </span>
              )}
              {message.metadata && (
                <div className="mt-2 space-y-2">
                  {/* Document Type */}
                  {message.metadata.documentType && (
                    <div className="text-xs">
                      <span className="font-semibold">Document Type:</span> {message.metadata.documentType}
                    </div>
                  )}
                  
                  {/* Legal Topic */}
                  {message.metadata.legalTopic && (
                    <div className="text-xs">
                      <span className="font-semibold">Topic:</span> {message.metadata.legalTopic}
                    </div>
                  )}
                  
                  {/* Confidence Score */}
                  {message.metadata.confidence && (
                    <div className="text-xs">
                      <span className="font-semibold">Confidence:</span> {Math.round(message.metadata.confidence * 100)}%
                    </div>
                  )}
                  
                  {/* References */}
                  {message.metadata.references && message.metadata.references.length > 0 && (
                    <div className="text-xs">
                      <span className="font-semibold">References:</span>
                      <ul className="list-disc list-inside">
                        {message.metadata.references.map((ref, idx) => (
                          <li key={idx}>
                            <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                              {ref.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Suggested Actions */}
                  {message.metadata.suggestedActions && message.metadata.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.metadata.suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={action.action}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Form Fields Preview */}
                  {message.metadata.formFields && (
                    <div className="text-xs mt-2">
                      <span className="font-semibold">Form Fields:</span>
                      <pre className="bg-gray-100 p-1 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(message.metadata.formFields, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-full ${
              isRecording ? 'bg-red-500' : 'bg-gray-200'
            } text-white hover:opacity-80 transition-colors`}
            disabled={isProcessing}
          >
            {isRecording ? <FaStop /> : <FaMicrophone />}
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or click the microphone to speak..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            disabled={isProcessing}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
} 