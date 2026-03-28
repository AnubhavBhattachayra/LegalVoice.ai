'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaPaperPlane, FaMicrophone, FaStopCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

const examplePrompts = [
  'What are the legal requirements for starting a business?',
  'How do I file for a patent?',
  'Can you help draft a non-disclosure agreement?',
  'What are my rights as a tenant?',
  'What is the difference between trademark and copyright?',
  'How do I create a legally binding contract?',
  'What should be included in a will?',
  'How do I form an LLC?'
];

export default function HomeChatBar() {
  const [input, setInput] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Store animation state in refs to avoid dependency cycles
  const stateRef = useRef({
    currentPromptIndex,
    currentCharIndex,
    placeholder,
    isTyping,
    isDeleting
  });

  // Update the ref whenever state changes
  useEffect(() => {
    stateRef.current = {
      currentPromptIndex,
      currentCharIndex,
      placeholder,
      isTyping,
      isDeleting
    };
  }, [currentPromptIndex, currentCharIndex, placeholder, isTyping, isDeleting]);

  // Clean up function to prevent memory leaks
  const cleanupTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Handle typing animation
  const typeText = useCallback(() => {
    const state = stateRef.current;
    const currentPrompt = examplePrompts[state.currentPromptIndex];
    
    if (state.currentCharIndex < currentPrompt.length) {
      setPlaceholder(prev => prev + currentPrompt[state.currentCharIndex]);
      setCurrentCharIndex(prev => prev + 1);
      
      // Continue typing - Slower speed
      const speed = Math.random() * 40 + 80; // Slower random typing speed between 80-120ms
      cleanupTimeout();
      timeoutRef.current = setTimeout(typeText, speed);
    } else {
      // Finished typing, longer pause before deleting
      cleanupTimeout();
      timeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setIsDeleting(true);
      }, 2500); // Longer pause at the end of the sentence
    }
  }, [cleanupTimeout]);

  // Handle deleting animation
  const deleteText = useCallback(() => {
    const state = stateRef.current;
    
    if (state.placeholder.length > 0) {
      setPlaceholder(prev => prev.slice(0, -1));
      
      // Continue deleting - Slower speed
      const speed = Math.random() * 25 + 40; // Slower deletion speed between 40-65ms
      cleanupTimeout();
      timeoutRef.current = setTimeout(deleteText, speed);
    } else {
      // Finished deleting, move to next prompt
      const nextPromptIndex = (state.currentPromptIndex + 1) % examplePrompts.length;
      setCurrentPromptIndex(nextPromptIndex);
      setCurrentCharIndex(0);
      setIsTyping(true);
      setIsDeleting(false);
      
      // Start typing the next prompt after a longer pause
      cleanupTimeout();
      timeoutRef.current = setTimeout(typeText, 1000); // Longer pause between sentences
    }
  }, [cleanupTimeout, typeText]);

  // Start animation when component mounts or animation state changes
  useEffect(() => {
    inputRef.current?.focus();
    
    // Start or continue the animation based on current state
    if (isTyping && !timeoutRef.current) {
      timeoutRef.current = setTimeout(typeText, 500);
    } else if (isDeleting && !timeoutRef.current) {
      timeoutRef.current = setTimeout(deleteText, 500);
    }
    
    // Cleanup on unmount or when dependencies change
    return cleanupTimeout;
  }, [isTyping, isDeleting, typeText, deleteText, cleanupTimeout]);

  // Effect for handling deletion state change
  useEffect(() => {
    if (isDeleting && !timeoutRef.current) {
      timeoutRef.current = setTimeout(deleteText, 500);
    }
  }, [isDeleting, deleteText]);

  const handleSubmit = () => {
    if (input.trim() === '') return;
    
    // Save the input to pass to the chat page
    localStorage.setItem('initialChatQuery', input);
    
    // Add a slight delay to ensure the animation looks smooth
    const btn = document.activeElement as HTMLElement;
    if (btn) btn.blur();
    
    // Navigate to chat page
    router.push('/chat');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Simulate stopping recording and getting a transcript
      setIsRecording(false);
      setInput('What legal documents do I need for a startup company?');
    } else {
      setIsRecording(true);
      // Simulate start recording
      setTimeout(() => {
        setIsRecording(false);
        setInput('What legal documents do I need for a startup company?');
      }, 2000);
    }
  };

  // Calculate cursor position based on placeholder length
  const cursorStyle = {
    left: `calc(24px + ${Math.min(placeholder.length, 40) * 8.8}px)`, // Limit cursor position for very long placeholders
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative z-10">
      <motion.div 
        className="flex items-center w-full bg-[#1c1f36] bg-opacity-[0.8] backdrop-blur-md border border-[#343a5a] border-opacity-[0.4] rounded-full shadow-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 py-5 px-6 bg-transparent border-0 text-white placeholder-white placeholder-opacity-[0.9] text-lg focus:outline-none focus:ring-0"
          suppressHydrationWarning
        />
        <div className="flex items-center pr-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`p-3 rounded-full mr-2 ${
              isRecording 
                ? 'bg-red-500 bg-opacity-[0.9]' 
                : 'bg-[#293256] bg-opacity-[0.7]'
            }`}
            onClick={toggleRecording}
            suppressHydrationWarning
          >
            {isRecording ? 
              <FaStopCircle className="text-white" size={20} /> : 
              <FaMicrophone className="text-white" size={20} />
            }
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-[color:var(--accent)] rounded-full shadow-[0_0_15px_rgba(255,42,127,0.3)]"
            onClick={handleSubmit}
            disabled={input.trim() === ''}
            suppressHydrationWarning
          >
            <FaPaperPlane className="text-white" size={20} />
          </motion.button>
        </div>

        {/* Typing cursor animation */}
        {input === '' && (
          <span 
            className="absolute top-1/2 transform -translate-y-1/2 h-5 w-[2px] bg-white animate-blink" 
            style={cursorStyle}
          />
        )}
      </motion.div>
      
      <p className="text-center text-white text-opacity-[0.8] mt-4 text-sm">
        Ask anything about legal documents, contracts, or procedures
      </p>
    </div>
  );
} 