'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaTrash, FaEllipsisV, FaEdit, FaPlus, FaSearch, FaClock, FaRegFileAlt } from 'react-icons/fa';
import { useAuth } from '@/app/lib/context/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

type Chat = {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
  documentId?: string;
  documentName?: string;
};

interface ChatHistoryProps {
  activeChatId?: string;
  onNewChat?: () => void;
}

export default function ChatHistory({ activeChatId, onNewChat }: ChatHistoryProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOptions, setShowOptions] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }
      
      const data = await response.json();
      
      if (data.status === 'success' && data.chats) {
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/chat/history?chatId=${chatId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }
      
      setChats(chats.filter(chat => chat._id !== chatId));
      toast.success('Chat deleted successfully');
      
      // If the active chat was deleted, redirect to new chat
      if (activeChatId === chatId) {
        if (onNewChat) {
          onNewChat();
        } else {
          router.push('/chat');
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    } finally {
      setShowDeleteModal(null);
      setIsProcessing(false);
    }
  };

  const handleRenameChat = async (chatId: string) => {
    if (!newChatTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/chat/rename`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId, title: newChatTitle }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to rename chat');
      }
      
      // Update the chat title in the local state
      setChats(chats.map(chat => 
        chat._id === chatId ? { ...chat, title: newChatTitle } : chat
      ));
      
      toast.success('Chat renamed successfully');
    } catch (error) {
      console.error('Error renaming chat:', error);
      toast.error('Failed to rename chat');
    } finally {
      setShowRenameModal(null);
      setNewChatTitle('');
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-800">Chat History</h2>
      </div>
      
      {/* Search and new chat */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FaPlus className="mr-2" /> New Chat
        </button>
      </div>
      
      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner size="medium" />
          </div>
        ) : filteredChats.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredChats.map((chat) => (
              <li key={chat._id} className="relative">
                <Link
                  href={`/chat/${chat._id}`}
                  className={`block px-4 py-3 hover:bg-gray-100 ${
                    activeChatId === chat._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-12">
                      <p className="text-sm font-medium text-gray-900 truncate">{chat.title}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{chat.lastMessage}</p>
                      <div className="flex items-center mt-1">
                        <FaClock className="text-xs text-gray-400 mr-1" />
                        <span className="text-xs text-gray-400">{formatDate(chat.updatedAt)}</span>
                        
                        {chat.documentId && (
                          <div className="flex items-center ml-2">
                            <FaRegFileAlt className="text-xs text-gray-400 mr-1" />
                            <span className="text-xs text-gray-400 truncate">
                              {chat.documentName || 'Document'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
                
                {/* Options button */}
                <button
                  className="absolute top-3 right-4 p-1 text-gray-400 hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions(showOptions === chat._id ? null : chat._id);
                  }}
                >
                  <FaEllipsisV />
                </button>
                
                {/* Options dropdown */}
                {showOptions === chat._id && (
                  <div className="absolute right-4 top-10 z-10 w-48 py-1 bg-white rounded-md shadow-lg border border-gray-200">
                    <button
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setShowOptions(null);
                        setShowRenameModal(chat._id);
                        setNewChatTitle(chat.title);
                      }}
                    >
                      <FaEdit className="mr-2" /> Rename
                    </button>
                    <button
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setShowOptions(null);
                        setShowDeleteModal(chat._id);
                      }}
                    >
                      <FaTrash className="mr-2" /> Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
            {searchTerm ? (
              <>
                <p className="text-gray-600 mb-2">No chats found matching "{searchTerm}"</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <FaRegFileAlt className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-600 mb-4">You don't have any chats yet</p>
                <button
                  onClick={onNewChat}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Start a new chat
                </button>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Rename modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-[0.5] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rename Chat</h3>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              placeholder="Enter new title"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={() => setShowRenameModal(null)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                onClick={() => handleRenameChat(showRenameModal)}
                disabled={isProcessing || !newChatTitle.trim()}
              >
                {isProcessing ? <LoadingSpinner size="small" className="mr-2" /> : null}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-[0.5] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Chat</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this chat? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={() => setShowDeleteModal(null)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
                onClick={() => handleDeleteChat(showDeleteModal)}
                disabled={isProcessing}
              >
                {isProcessing ? <LoadingSpinner size="small" className="mr-2" /> : <FaTrash className="mr-2" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 