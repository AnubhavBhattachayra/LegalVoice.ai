'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FaSearch, 
  FaBook, 
  FaVideo, 
  FaFileAlt, 
  FaRegClock, 
  FaRegUser, 
  FaChevronRight, 
  FaChevronDown,
  FaBookmark,
  FaRegBookmark,
  FaSpinner,
  FaTags,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

// Interface for resource item
interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'guide' | 'template';
  category: string;
  topics: string[];
  author: string;
  date: string;
  readTime?: number; // in minutes
  videoLength?: number; // in minutes
  image?: string;
  link: string;
  premium: boolean;
}

// Interface for category
interface Category {
  id: string;
  name: string;
  description: string;
  count: number;
}

// Categories data
const categories: Category[] = [
  {
    id: 'personal-legal',
    name: 'Personal Legal Matters',
    description: 'Family law, estate planning, and personal rights',
    count: 28
  },
  {
    id: 'business-law',
    name: 'Business Law',
    description: 'Formation, contracts, intellectual property, and employment',
    count: 34
  },
  {
    id: 'property-housing',
    name: 'Property & Housing',
    description: 'Real estate, renting, mortgages, and property rights',
    count: 19
  },
  {
    id: 'criminal-law',
    name: 'Criminal Law',
    description: 'Criminal procedure, rights, and defense',
    count: 16
  },
  {
    id: 'civil-litigation',
    name: 'Civil Litigation',
    description: 'Lawsuits, small claims, and dispute resolution',
    count: 12
  },
  {
    id: 'immigration',
    name: 'Immigration',
    description: 'Visas, citizenship, and immigration processes',
    count: 8
  }
];

// Mock popular topics
const popularTopics = [
  'Tenant Rights', 
  'Starting a Business', 
  'Divorce Process', 
  'Wills & Trusts', 
  'Employment Contracts', 
  'Intellectual Property',
  'Child Custody',
  'DUI Defense'
];

// Sample resources data
const resourcesData: Resource[] = [
  {
    id: '1',
    title: 'Understanding Tenant Rights: A Comprehensive Guide',
    description: 'Learn about your rights as a tenant, including habitability, privacy, eviction protections, and security deposits.',
    type: 'guide',
    category: 'property-housing',
    topics: ['Tenant Rights', 'Rental Law', 'Eviction'],
    author: 'Sarah Johnson, Esq.',
    date: '2023-04-15',
    readTime: 12,
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fGFwYXJ0bWVudHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
    link: '/learn/articles/understanding-tenant-rights',
    premium: false
  },
  {
    id: '2',
    title: 'How to Form an LLC: Step-by-Step Guide',
    description: 'A complete walkthrough of forming a Limited Liability Company, from choosing a name to filing articles of organization.',
    type: 'guide',
    category: 'business-law',
    topics: ['Starting a Business', 'LLC', 'Business Formation'],
    author: 'Michael Chen, Esq.',
    date: '2023-05-22',
    readTime: 15,
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTR8fGJ1c2luZXNzfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
    link: '/learn/articles/forming-an-llc',
    premium: false
  },
  {
    id: '3',
    title: 'Divorce Process Explained',
    description: 'An overview of the divorce process, including filing, division of assets, child custody considerations, and timeline.',
    type: 'video',
    category: 'personal-legal',
    topics: ['Divorce Process', 'Family Law', 'Child Custody'],
    author: 'Jennifer Martinez, Esq.',
    date: '2023-06-10',
    videoLength: 22,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8ZGl2b3JjZXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
    link: '/learn/videos/divorce-process-explained',
    premium: false
  },
  {
    id: '4',
    title: 'Estate Planning Essentials: Wills, Trusts, and More',
    description: 'Learn the fundamentals of estate planning, including wills, trusts, power of attorney, and healthcare directives.',
    type: 'article',
    category: 'personal-legal',
    topics: ['Wills & Trusts', 'Estate Planning', 'Probate'],
    author: 'Robert Williams, Esq.',
    date: '2023-07-05',
    readTime: 10,
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Nnx8d2lsbHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
    link: '/learn/articles/estate-planning-essentials',
    premium: true
  },
  {
    id: '5',
    title: 'Understanding Intellectual Property: Patents, Trademarks, and Copyrights',
    description: 'A comprehensive guide to different types of intellectual property protection and when to use each.',
    type: 'article',
    category: 'business-law',
    topics: ['Intellectual Property', 'Patent Law', 'Copyright Law', 'Trademark Law'],
    author: 'David Kim, Esq.',
    date: '2023-08-18',
    readTime: 14,
    image: 'https://images.unsplash.com/photo-1607703703520-bb638e84caf2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8aW50ZWxsZWN0dWFsJTIwcHJvcGVydHl8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
    link: '/learn/articles/understanding-intellectual-property',
    premium: true
  },
  {
    id: '6',
    title: 'Employment Contract Template with Explanations',
    description: 'A customizable employment contract template with detailed explanations of key clauses and provisions.',
    type: 'template',
    category: 'business-law',
    topics: ['Employment Contracts', 'HR Law', 'Workplace'],
    author: 'Legal Templates Team',
    date: '2023-09-03',
    readTime: 8,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8Y29udHJhY3R8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
    link: '/learn/templates/employment-contract',
    premium: true
  },
  {
    id: '7',
    title: 'Know Your Rights During Criminal Arrest',
    description: 'Important information about your constitutional rights during arrest and police interaction.',
    type: 'video',
    category: 'criminal-law',
    topics: ['Criminal Procedure', 'Constitutional Rights', 'Police Encounters'],
    author: 'Criminal Defense Network',
    date: '2023-10-12',
    videoLength: 18,
    image: 'https://images.unsplash.com/photo-1589216532372-1c2a3056b7ad?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8cG9saWNlfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
    link: '/learn/videos/rights-during-arrest',
    premium: false
  },
  {
    id: '8',
    title: 'Small Claims Court: A Step-by-Step Guide',
    description: 'Everything you need to know about filing a case in small claims court, preparing evidence, and presenting your case.',
    type: 'guide',
    category: 'civil-litigation',
    topics: ['Small Claims', 'Civil Procedure', 'Dispute Resolution'],
    author: 'Sophia Wilson, Esq.',
    date: '2023-11-05',
    readTime: 20,
    image: 'https://images.unsplash.com/photo-1589216532372-1c2a3056b7ad?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8cG9saWNlfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
    link: '/learn/guides/small-claims-court',
    premium: false
  }
];

const LearnPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(true);
  const [bookmarkedResources, setBookmarkedResources] = useState<string[]>([]);
  
  // Initialize state from URL parameters
  useEffect(() => {
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const topic = searchParams.get('topic');
    const query = searchParams.get('q');
    
    if (category) setSelectedCategory(category);
    if (type) setSelectedType(type);
    if (topic) setSelectedTopic(topic);
    if (query) setSearchQuery(query);
    
    // Simulate loading resources
    setIsLoading(true);
    setTimeout(() => {
      setResources(resourcesData);
      setIsLoading(false);
    }, 1000);
    
    // Simulate loading bookmarks for logged in user
    if (user) {
      setTimeout(() => {
        setBookmarkedResources(['1', '4']);
      }, 1200);
    }
  }, [searchParams, user]);
  
  // Filter resources based on search and filters
  useEffect(() => {
    let filtered = [...resources];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(resource => 
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        resource.topics.some(topic => topic.toLowerCase().includes(query))
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }
    
    // Filter by type
    if (selectedType) {
      filtered = filtered.filter(resource => resource.type === selectedType);
    }
    
    // Filter by topic
    if (selectedTopic) {
      filtered = filtered.filter(resource => 
        resource.topics.includes(selectedTopic)
      );
    }
    
    // Filter premium content
    if (showPremiumOnly) {
      filtered = filtered.filter(resource => resource.premium);
    }
    
    setFilteredResources(filtered);
  }, [resources, searchQuery, selectedCategory, selectedType, selectedTopic, showPremiumOnly]);
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams();
  };
  
  // Update URL parameters
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedType) params.set('type', selectedType);
    if (selectedTopic) params.set('topic', selectedTopic);
    
    router.push(`/learn?${params.toString()}`);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedType(null);
    setSelectedTopic(null);
    setShowPremiumOnly(false);
    router.push('/learn');
  };
  
  // Toggle bookmark state
  const toggleBookmark = (resourceId: string) => {
    if (!user) {
      router.push('/login?redirect=/learn');
      return;
    }
    
    if (bookmarkedResources.includes(resourceId)) {
      setBookmarkedResources(bookmarkedResources.filter(id => id !== resourceId));
    } else {
      setBookmarkedResources([...bookmarkedResources, resourceId]);
    }
    
    // In a real app, this would make an API call to save the bookmark
  };
  
  // Select a topic
  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    updateSearchParams();
  };
  
  // Render icon based on resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FaFileAlt className="text-indigo-600" />;
      case 'video':
        return <FaVideo className="text-red-600" />;
      case 'guide':
        return <FaBook className="text-green-600" />;
      case 'template':
        return <FaFileAlt className="text-orange-600" />;
      default:
        return <FaFileAlt className="text-gray-600" />;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Legal Education Resources</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore our library of articles, guides, videos, and templates to enhance your legal knowledge
          </p>
        </div>
        
        {/* Search bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search for legal topics, guides, articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-r-md"
            >
              Search
            </button>
          </form>
        </div>
        
        {/* Popular topics */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Topics</h2>
          <div className="flex flex-wrap gap-2">
            {popularTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => handleTopicSelect(topic)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedTopic === topic
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-32">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-gray-900">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Clear all
                </button>
              </div>
              
              {/* Resource type filter */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Resource Type</h3>
                <div className="space-y-2">
                  {['article', 'video', 'guide', 'template'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="radio"
                        name="resourceType"
                        checked={selectedType === type}
                        onChange={() => setSelectedType(type)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <span className="ml-2 text-gray-700 capitalize">{type}s</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Categories filter */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900">Categories</h3>
                  <button 
                    onClick={() => setExpandedCategories(!expandedCategories)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedCategories ? <FaChevronDown /> : <FaChevronRight />}
                  </button>
                </div>
                
                {expandedCategories && (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === category.id}
                          onChange={() => setSelectedCategory(category.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-2 text-gray-700">{category.name}</span>
                        <span className="ml-1 text-gray-500 text-xs">({category.count})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Premium content filter */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showPremiumOnly}
                    onChange={() => setShowPremiumOnly(!showPremiumOnly)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700">Premium content only</span>
                </label>
              </div>
              
              {user && (
                <div>
                  <Link 
                    href="/learn/bookmarks"
                    className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    <FaBookmark className="mr-2" />
                    View Bookmarked Resources
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Main content area */}
          <div className="lg:w-3/4">
            {/* Results info */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {isLoading 
                  ? 'Loading resources...'
                  : `${filteredResources.length} ${filteredResources.length === 1 ? 'Resource' : 'Resources'} Found`
                }
              </h2>
              
              {(selectedCategory || selectedType || selectedTopic || searchQuery) && (
                <div className="text-sm">
                  <span className="text-gray-600 mr-2">Filtered by:</span>
                  {selectedCategory && (
                    <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-md mr-2">
                      {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                    </span>
                  )}
                  {selectedType && (
                    <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-md mr-2 capitalize">
                      {selectedType}s
                    </span>
                  )}
                  {selectedTopic && (
                    <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-md mr-2">
                      {selectedTopic}
                    </span>
                  )}
                  {searchQuery && (
                    <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-md">
                      "{searchQuery}"
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Resources grid */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-indigo-600 mr-2" />
                <span>Loading resources...</span>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h3 className="text-xl font-medium text-gray-900 mb-2">No resources found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or filters to find more results.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredResources.map((resource) => (
                  <div 
                    key={resource.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-300"
                  >
                    {resource.image && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={resource.image}
                          alt={resource.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6 flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          {getResourceIcon(resource.type)}
                          <span className="ml-2 text-sm font-medium text-gray-600 capitalize">
                            {resource.type}
                          </span>
                        </div>
                        
                        {resource.premium && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                            Premium
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {resource.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {resource.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {resource.topics.slice(0, 3).map((topic) => (
                          <button
                            key={topic}
                            onClick={() => handleTopicSelect(topic)}
                            className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-100"
                          >
                            {topic}
                          </button>
                        ))}
                        {resource.topics.length > 3 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{resource.topics.length - 3} more
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <FaRegUser className="mr-1" />
                        <span>{resource.author}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(resource.date)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <FaRegClock className="mr-1" />
                        <span>
                          {resource.readTime 
                            ? `${resource.readTime} min read` 
                            : resource.videoLength 
                              ? `${resource.videoLength} min video` 
                              : ''
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
                      <Link
                        href={resource.link}
                        className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                      >
                        {resource.type === 'article' || resource.type === 'guide' ? 'Read ' : 
                         resource.type === 'video' ? 'Watch ' : 'View '}
                        <FaChevronRight className="ml-1" size={12} />
                      </Link>
                      
                      <button
                        onClick={() => toggleBookmark(resource.id)}
                        className="text-gray-500 hover:text-indigo-600"
                        title={bookmarkedResources.includes(resource.id) ? "Remove bookmark" : "Bookmark this resource"}
                      >
                        {bookmarkedResources.includes(resource.id) ? <FaBookmark /> : <FaRegBookmark />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default LearnPage; 