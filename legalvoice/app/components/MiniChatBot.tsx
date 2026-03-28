'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaPaperPlane, FaMicrophone, FaStopCircle, FaRobot, FaUser, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function MiniChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your AI legal assistant. How can I help you today?'
    }
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = () => {
    if (input.trim() === '') return;

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: input
      }
    ]);

    // Clear input
    setInput('');

    // Simulate AI typing with a delay
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: "I'd be happy to help with that. Let's continue this conversation in the full chat interface for a more detailed response."
        }
      ]);
    }, 1000);

    // After 2 seconds, navigate to the full chat page
    setTimeout(() => {
      router.push('/chat');
    }, 3000);
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Simulate stopping recording and getting a transcript
      setIsRecording(false);
      setInput('Tell me about legal requirements for starting a business');
    } else {
      setIsRecording(true);
      // Simulate start recording
      setTimeout(() => {
        setIsRecording(false);
        setInput('Tell me about legal requirements for starting a business');
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 24
      } 
    },
    exit: { 
      opacity: 0,
      y: 20,
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const toggleButtonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  return (
    <>
      <motion.button
        className="fixed right-6 bottom-6 w-14 h-14 rounded-full bg-[color:var(--primary)] text-white flex items-center justify-center shadow-lg z-30 glow-effect"
        onClick={toggleChat}
        variants={toggleButtonVariants}
        whileHover="hover"
        whileTap="tap"
        suppressHydrationWarning
      >
        {isOpen ? <FaTimes size={20} /> : <FaRobot size={24} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed right-6 bottom-24 w-80 sm:w-96 bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl shadow-xl overflow-hidden z-30"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-white">
              <h3 className="font-bold flex items-center">
                <FaRobot className="mr-2" /> LegalVoice AI Assistant
              </h3>
            </div>

            {/* Chat Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div
                      className={`max-w-3/4 rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-[color:var(--primary)] text-white rounded-br-none'
                          : 'bg-[color:var(--muted)] text-[color:var(--foreground)] rounded-bl-none'
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        {message.role === 'assistant' ? (
                          <FaRobot className="mr-1 text-[color:var(--accent)]" size={12} />
                        ) : (
                          <FaUser className="mr-1 text-white" size={12} />
                        )}
                        <span className="text-xs font-bold">
                          {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="border-t border-[color:var(--border)] p-3 flex items-center">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask a legal question..."
                className="flex-1 px-3 py-2 rounded-l-lg bg-[color:var(--muted)] border-0 text-[color:var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                suppressHydrationWarning
              />
              <button
                className={`p-2 ${
                  isRecording ? 'bg-red-600' : 'bg-[color:var(--secondary)]'
                } text-white rounded-none`}
                onClick={toggleRecording}
                suppressHydrationWarning
              >
                {isRecording ? <FaStopCircle /> : <FaMicrophone />}
              </button>
              <button
                className="p-2 bg-[color:var(--primary)] text-white rounded-r-lg disabled:opacity-[0.5]"
                onClick={handleSendMessage}
                disabled={input.trim() === ''}
                suppressHydrationWarning
              >
                <FaPaperPlane />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 