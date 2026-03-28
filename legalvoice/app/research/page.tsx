'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FaSearch, 
  FaFilter, 
  FaBook, 
  FaGavel, 
  FaUniversity, 
  FaRegFileAlt, 
  FaSpinner,
  FaDownload,
  FaBookmark,
  FaRegBookmark,
  FaStar,
  FaChevronRight
} from 'react-icons/fa';
import { useAuthContext } from '@/app/lib/context/AuthContext';

// Resource interface
interface Resource {
  id: string;
  title: string;
  type: 'case' | 'statute' | 'article' | 'form';
  source: string;
  citation?: string;
  description: string;
  jurisdiction?: string;
  date: string;
  url: string;
  premium: boolean;
  downloadable: boolean;
}

// Filter interface
interface Filters {
  type: string | null;
  jurisdiction: string | null;
  source: string | null;
  dateRange: [number, number] | null;
  premium: boolean;
}

const ResearchPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuthContext();
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [savedResources, setSavedResources] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({
    type: null,
    jurisdiction: null,
    source: null,
    dateRange: null,
    premium: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Mock resource data
  const mockResources: Resource[] = [
    {
      id: '1',
      title: 'Brown v. Board of Education',
      type: 'case',
      source: 'Supreme Court',
      citation: '347 U.S. 483 (1954)',
      description: 'Landmark decision of the U.S. Supreme Court in which the Court ruled that U.S. state laws establishing racial segregation in public schools are unconstitutional.',
      jurisdiction: 'Federal',
      date: '1954-05-17',
      url: '/research/cases/brown-v-board',
      premium: false,
      downloadable: true,
    },
    {
      id: '2',
      title: 'California Civil Code § 1950.5',
      type: 'statute',
      source: 'California State Legislature',
      citation: 'Cal. Civ. Code § 1950.5',
      description: 'California security deposit law that regulates how landlords can collect, maintain, and refund security deposits.',
      jurisdiction: 'California',
      date: '2023-01-01',
      url: '/research/statutes/ca-civil-code-1950-5',
      premium: false,
      downloadable: true,
    },
    {
      id: '3',
      title: 'The Impact of AI on Legal Research',
      type: 'article',
      source: 'Harvard Law Review',
      description: 'Examines how artificial intelligence is transforming legal research methodologies and outcomes.',
      date: '2023-03-15',
      url: '/research/articles/ai-legal-research',
      premium: true,
      downloadable: true,
    },
    {
      id: '4',
      title: 'Standard Residential Lease Agreement',
      type: 'form',
      source: 'LegalVoice Forms',
      description: 'A comprehensive residential lease agreement template with state-specific provisions.',
      jurisdiction: 'Multiple',
      date: '2023-01-10',
      url: '/research/forms/residential-lease',
      premium: true,
      downloadable: true,
    },
    {
      id: '5',
      title: 'Roe v. Wade',
      type: 'case',
      source: 'Supreme Court',
      citation: '410 U.S. 113 (1973)',
      description: 'Landmark decision of the U.S. Supreme Court in which the Court ruled that the Constitution of the United States generally protects a pregnant woman\'s liberty to choose to have an abortion.',
      jurisdiction: 'Federal',
      date: '1973-01-22',
      url: '/research/cases/roe-v-wade',
      premium: false,
      downloadable: true,
    },
    {
      id: '6',
      title: 'Americans with Disabilities Act',
      type: 'statute',
      source: 'United States Congress',
      citation: '42 U.S.C. § 12101 et seq.',
      description: 'Civil rights law that prohibits discrimination based on disability in public accommodations, employment, transportation, and telecommunications.',
      jurisdiction: 'Federal',
      date: '1990-07-26',
      url: '/research/statutes/ada',
      premium: false,
      downloadable: true,
    },
    {
      id: '7',
      title: 'Understanding Force Majeure Clauses After COVID-19',
      type: 'article',
      source: 'Yale Law Journal',
      description: 'Analysis of how courts have interpreted force majeure clauses in contracts following the COVID-19 pandemic.',
      date: '2022-11-05',
      url: '/research/articles/force-majeure-covid19',
      premium: true,
      downloadable: true,
    },
    {
      id: '8',
      title: 'Small Claims Court Complaint Form',
      type: 'form',
      source: 'LegalVoice Forms',
      description: 'Standard small claims court complaint form with instructions for filing.',
      jurisdiction: 'Multiple',
      date: '2023-02-20',
      url: '/research/forms/small-claims-complaint',
      premium: false,
      downloadable: true,
    },
  ];
  
  // Initialize from URL params
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) setSearchQuery(query);
    
    // Type filter
    const type = searchParams.get('type');
    if (type) setFilters(prev => ({ ...prev, type }));
    
    // Jurisdiction filter
    const jurisdiction = searchParams.get('jurisdiction');
    if (jurisdiction) setFilters(prev => ({ ...prev, jurisdiction }));
    
    // Source filter
    const source = searchParams.get('source');
    if (source) setFilters(prev => ({ ...prev, source }));
    
    // Premium filter
    const premium = searchParams.get('premium');
    if (premium === 'true') setFilters(prev => ({ ...prev, premium: true }));
    
    // Simulate loading data
    setIsLoading(true);
    setTimeout(() => {
      setResources(mockResources);
      setIsLoading(false);
    }, 1000);
    
    // If user is logged in, load saved resources
    if (user) {
      // In a real app, this would be an API call
      setSavedResources(['1', '3']);
    }
  }, [searchParams, user]);
  
  // Filter resources
  useEffect(() => {
    let filtered = [...resources];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(resource => 
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        (resource.citation && resource.citation.toLowerCase().includes(query))
      );
    }
    
    // Filter by type
    if (filters.type) {
      filtered = filtered.filter(resource => resource.type === filters.type);
    }
    
    // Filter by jurisdiction
    if (filters.jurisdiction) {
      filtered = filtered.filter(resource => 
        resource.jurisdiction && resource.jurisdiction === filters.jurisdiction
      );
    }
    
    // Filter by source
    if (filters.source) {
      filtered = filtered.filter(resource => 
        resource.source.toLowerCase().includes(filters.source!.toLowerCase())
      );
    }
    
    // Filter by premium status
    if (filters.premium) {
      filtered = filtered.filter(resource => resource.premium);
    }
    
    setFilteredResources(filtered);
  }, [resources, searchQuery, filters]);
  
  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      params.delete('q');
    }
    router.push(`/research?${params.toString()}`);
  };
  
  // Toggle saving a resource
  const toggleSaveResource = (resourceId: string) => {
    if (!user) {
      router.push('/login?redirect=/research');
      return;
    }
    
    if (savedResources.includes(resourceId)) {
      setSavedResources(savedResources.filter(id => id !== resourceId));
    } else {
      setSavedResources([...savedResources, resourceId]);
    }
    
    // In a real app, this would make an API call to save the resource
  };
  
  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('q', searchQuery);
    if (filters.type) params.set('type', filters.type);
    if (filters.jurisdiction) params.set('jurisdiction', filters.jurisdiction);
    if (filters.source) params.set('source', filters.source);
    if (filters.premium) params.set('premium', 'true');
    
    router.push(`/research?${params.toString()}`);
    setShowFilters(false);
  };
  
  // Clear filters
  const clearFilters = () => {
    setFilters({
      type: null,
      jurisdiction: null,
      source: null,
      dateRange: null,
      premium: false,
    });
    router.push('/research');
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Get icon by resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'case':
        return <FaGavel className="text-indigo-600" />;
      case 'statute':
        return <FaBook className="text-green-600" />;
      case 'article':
        return <FaRegFileAlt className="text-orange-600" />;
      case 'form':
        return <FaRegFileAlt className="text-blue-600" />;
      default:
        return <FaRegFileAlt className="text-gray-600" />;
    }
  };
  
  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
      </div>
    );
  }
  
  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Legal Research Database</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Search through cases, statutes, articles, and forms for your legal research needs
          </p>
        </div>
        
        {/* Search section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow relative">
              <input
                type="text"
                placeholder="Search by keyword, citation, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center"
              >
                <FaFilter className="mr-2" />
                Filters
                {Object.values(filters).some(value => value !== null && value !== false) && (
                  <span className="ml-2 bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {Object.values(filters).filter(value => value !== null && value !== false).length}
                  </span>
                )}
              </button>
              
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
              >
                Search
              </button>
            </div>
          </form>
          
          {/* Filters panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900">Refine your search</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Clear all filters
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Resource type filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
                  <select
                    value={filters.type || ''}
                    onChange={(e) => setFilters({...filters, type: e.target.value || null})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Types</option>
                    <option value="case">Cases</option>
                    <option value="statute">Statutes & Regulations</option>
                    <option value="article">Articles & Journals</option>
                    <option value="form">Forms & Templates</option>
                  </select>
                </div>
                
                {/* Jurisdiction filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jurisdiction</label>
                  <select
                    value={filters.jurisdiction || ''}
                    onChange={(e) => setFilters({...filters, jurisdiction: e.target.value || null})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Jurisdictions</option>
                    <option value="Federal">Federal</option>
                    <option value="California">California</option>
                    <option value="New York">New York</option>
                    <option value="Texas">Texas</option>
                    <option value="Florida">Florida</option>
                    <option value="Multiple">Multiple States</option>
                  </select>
                </div>
                
                {/* Source filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                  <select
                    value={filters.source || ''}
                    onChange={(e) => setFilters({...filters, source: e.target.value || null})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Sources</option>
                    <option value="Supreme Court">Supreme Court</option>
                    <option value="Congress">U.S. Congress</option>
                    <option value="Harvard">Harvard Law Review</option>
                    <option value="Yale">Yale Law Journal</option>
                    <option value="LegalVoice">LegalVoice Forms</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="premium-only"
                  checked={filters.premium}
                  onChange={(e) => setFilters({...filters, premium: e.target.checked})}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="premium-only" className="ml-2 text-sm text-gray-700">
                  Premium resources only
                </label>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={applyFilters}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Results section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isLoading ? 'Loading resources...' : `${filteredResources.length} Resources Found`}
            </h2>
            
            {user && (
              <Link
                href="/research/saved"
                className="text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                <FaBookmark className="mr-2" />
                View Saved Research
              </Link>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-md">
              <FaSpinner className="animate-spin text-indigo-600 mr-2" />
              <span>Loading resources...</span>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h3 className="text-xl font-medium text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters.
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResources.map((resource) => (
                <div 
                  key={resource.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <div className="flex items-center mb-2">
                          {getResourceIcon(resource.type)}
                          <span className="ml-2 text-sm font-medium text-gray-600 capitalize">
                            {resource.type}
                          </span>
                          {resource.premium && (
                            <span className="ml-3 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                              Premium
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {resource.title}
                        </h3>
                        
                        {resource.citation && (
                          <p className="text-sm text-gray-700 mb-2 font-mono">
                            {resource.citation}
                          </p>
                        )}
                        
                        <p className="text-gray-600 mb-4">
                          {resource.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <FaUniversity className="mr-1" />
                            <span>{resource.source}</span>
                          </div>
                          
                          {resource.jurisdiction && (
                            <div>
                              <span className="text-gray-700">Jurisdiction:</span>{' '}
                              <span>{resource.jurisdiction}</span>
                            </div>
                          )}
                          
                          <div>
                            <span>{formatDate(resource.date)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center space-y-2 ml-4">
                        <button
                          onClick={() => toggleSaveResource(resource.id)}
                          className="text-gray-500 hover:text-indigo-600 p-2"
                          title={savedResources.includes(resource.id) ? "Remove from saved" : "Save for later"}
                        >
                          {savedResources.includes(resource.id) ? (
                            <FaBookmark className="text-indigo-600" size={20} />
                          ) : (
                            <FaRegBookmark size={20} />
                          )}
                        </button>
                        
                        {resource.downloadable && (
                          <button
                            className="text-gray-500 hover:text-indigo-600 p-2"
                            title="Download resource"
                          >
                            <FaDownload size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <Link
                      href={resource.url}
                      className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                    >
                      View Full Resource
                      <FaChevronRight className="ml-1" size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Research help section */}
        <div className="bg-indigo-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Need Research Assistance?</h2>
          <p className="text-gray-700 mb-4">
            Our research specialists can help you find the resources you need for your legal matter.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/chat"
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
            >
              Ask Legal AI Assistant
            </Link>
            <Link
              href="/lawyers"
              className="bg-white border border-indigo-600 text-indigo-600 px-6 py-2 rounded-md hover:bg-indigo-50"
            >
              Connect with a Lawyer
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ResearchPage; 