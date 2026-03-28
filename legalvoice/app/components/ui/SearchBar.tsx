'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaTimes, FaFile, FaComments, FaComment, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface SearchResult {
  _id: string;
  title?: string;
  content?: string;
  lastMessage?: string;
  resultType: 'document' | 'chat' | 'message';
  updatedAt?: string;
  timestamp?: string;
  chat?: {
    _id: string;
    title: string;
  };
}

export default function SearchBar() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handle clicks outside the search bar to close results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        if (query === '') {
          setIsExpanded(false);
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query]);

  // Handle search input changes
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    if (value.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    
    // Set new timeout for debounce
    debounceTimeout.current = setTimeout(() => {
      fetchResults(value);
    }, 300);
  };

  // Fetch search results
  const fetchResults = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) return;
    
    setIsLoading(true);
    setShowResults(true);
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to search');
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission for full search page
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim().length < 2) return;
    
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setShowResults(false);
  };

  // Handle clicking on a search result
  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    
    // Different navigation based on result type
    if (result.resultType === 'document') {
      router.push(`/documents/${result._id}`);
    } else if (result.resultType === 'chat') {
      router.push(`/chat/${result._id}`);
    } else if (result.resultType === 'message') {
      router.push(`/chat/${result.chat?._id}`);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };

  // Get icon based on result type
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FaFile className="text-blue-500" />;
      case 'chat':
        return <FaComments className="text-green-500" />;
      case 'message':
        return <FaComment className="text-purple-500" />;
      default:
        return <FaSearch className="text-gray-500" />;
    }
  };

  // Highlight matching text in results
  const highlightMatch = (text: string, query: string) => {
    if (!text) return '';
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-100 rounded px-1">$1</mark>');
  };

  return (
    <div className="relative w-full max-w-lg" ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className={`flex items-center bg-white border ${isExpanded ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-300'} rounded-lg transition-all duration-200 ${isExpanded ? 'w-full' : 'w-48 md:w-60'}`}>
          <div className="pl-3 pr-2">
            <FaSearch className="text-gray-400" />
          </div>
          
          <input
            type="text"
            className="py-2 pl-0 pr-8 w-full bg-transparent border-none focus:ring-0 focus:outline-none text-sm"
            placeholder="Search..."
            value={query}
            onChange={handleSearch}
            onFocus={() => setIsExpanded(true)}
            ref={inputRef}
          />
          
          {query && (
            <button
              type="button"
              className="absolute right-3 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setQuery('');
                setResults([]);
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
            >
              <FaTimes />
            </button>
          )}
        </div>
      </form>
      
      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <FaSpinner className="animate-spin mx-auto h-5 w-5 text-gray-500" />
              <p className="mt-2 text-sm text-gray-600">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div>
              <ul>
                {results.map((result) => (
                  <li key={`${result.resultType}-${result._id}`} className="border-b border-gray-100 last:border-b-0">
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          {getResultIcon(result.resultType)}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {result.resultType === 'message' ? (
                              <>In chat: <span dangerouslySetInnerHTML={{ __html: highlightMatch(result.chat?.title || '', query) }} /></>
                            ) : (
                              <span dangerouslySetInnerHTML={{ __html: highlightMatch(result.title || '', query) }} />
                            )}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {result.resultType === 'chat' ? (
                              <span dangerouslySetInnerHTML={{ __html: highlightMatch(result.lastMessage || '', query) }} />
                            ) : (
                              <span dangerouslySetInnerHTML={{ __html: highlightMatch(result.content || '', query) }} />
                            )}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(result.updatedAt || result.timestamp)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              
              <div className="p-2 border-t border-gray-100">
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="block w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                  onClick={() => setShowResults(false)}
                >
                  View all results
                </Link>
              </div>
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-600">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-600">Type at least 2 characters to search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 