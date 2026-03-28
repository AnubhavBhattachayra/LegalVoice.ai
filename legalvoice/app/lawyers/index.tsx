'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaSearch, FaStar, FaMapMarkerAlt, FaFilter, FaGavel, FaClock, FaMoneyBillWave, FaTimes } from 'react-icons/fa';

// Define the Lawyer interface
interface Lawyer {
  id: string;
  name: string;
  image: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  location: string;
  price: number;
  availability: string[];
  languages: string[];
}

// Mock data for lawyers
const mockLawyers: Lawyer[] = [
  {
    id: 'lawyer-1',
    name: 'Sarah Johnson',
    image: 'https://randomuser.me/api/portraits/women/33.jpg',
    specialties: ['Corporate Law', 'Contract Law', 'Business Formation'],
    rating: 4.8,
    reviewCount: 124,
    location: 'New York, NY',
    price: 250,
    availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    languages: ['English', 'Spanish']
  },
  {
    id: 'lawyer-2',
    name: 'Michael Chen',
    image: 'https://randomuser.me/api/portraits/men/45.jpg',
    specialties: ['Intellectual Property', 'Patent Law', 'Copyright Law'],
    rating: 4.9,
    reviewCount: 89,
    location: 'San Francisco, CA',
    price: 300,
    availability: ['Monday', 'Wednesday', 'Friday'],
    languages: ['English', 'Mandarin', 'Cantonese']
  },
  {
    id: 'lawyer-3',
    name: 'Robert Williams',
    image: 'https://randomuser.me/api/portraits/men/22.jpg',
    specialties: ['Tax Law', 'Estate Planning', 'Financial Regulations'],
    rating: 4.6,
    reviewCount: 76,
    location: 'Chicago, IL',
    price: 225,
    availability: ['Tuesday', 'Thursday', 'Saturday'],
    languages: ['English', 'French']
  },
  {
    id: 'lawyer-4',
    name: 'Jennifer Martinez',
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
    specialties: ['Family Law', 'Divorce', 'Child Custody'],
    rating: 4.7,
    reviewCount: 102,
    location: 'Los Angeles, CA',
    price: 275,
    availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    languages: ['English', 'Spanish']
  },
  {
    id: 'lawyer-5',
    name: 'David Kim',
    image: 'https://randomuser.me/api/portraits/men/36.jpg',
    specialties: ['Criminal Law', 'DUI Defense', 'White Collar Crime'],
    rating: 4.5,
    reviewCount: 57,
    location: 'Seattle, WA',
    price: 240,
    availability: ['Monday', 'Wednesday', 'Friday'],
    languages: ['English', 'Korean']
  },
  {
    id: 'lawyer-6',
    name: 'Sophia Wilson',
    image: 'https://randomuser.me/api/portraits/women/54.jpg',
    specialties: ['Employment Law', 'Workplace Discrimination', 'Labor Relations'],
    rating: 4.9,
    reviewCount: 92,
    location: 'Boston, MA',
    price: 280,
    availability: ['Tuesday', 'Thursday', 'Friday'],
    languages: ['English']
  },
];

// Define specialty options
const specialtyOptions = [
  'Corporate Law',
  'Contract Law',
  'Business Formation',
  'Intellectual Property',
  'Patent Law',
  'Copyright Law',
  'Tax Law',
  'Estate Planning',
  'Financial Regulations',
  'Family Law',
  'Divorce',
  'Child Custody',
  'Criminal Law',
  'DUI Defense',
  'White Collar Crime',
  'Employment Law',
  'Workplace Discrimination',
  'Labor Relations'
];

// Define language options
const languageOptions = [
  'English',
  'Spanish',
  'French',
  'Mandarin',
  'Cantonese',
  'Korean'
];

// Location options
const locationOptions = [
  'New York, NY',
  'San Francisco, CA',
  'Chicago, IL',
  'Los Angeles, CA',
  'Seattle, WA',
  'Boston, MA'
];

export default function LawyersListingPage() {
  // State for filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [availabilityDays, setAvailabilityDays] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<string>('rating_high');
  
  // State for filtered and displayed lawyers
  const [filteredLawyers, setFilteredLawyers] = useState<Lawyer[]>(mockLawyers);
  const [isLoading, setIsLoading] = useState(true);
  
  // Days of week for availability filter
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Effect to simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Effect to filter lawyers based on filters and search query
  useEffect(() => {
    if (isLoading) return;
    
    let filtered = [...mockLawyers];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lawyer => 
        lawyer.name.toLowerCase().includes(query) ||
        lawyer.specialties.some(specialty => specialty.toLowerCase().includes(query))
      );
    }
    
    // Filter by selected specialties
    if (selectedSpecialties.length > 0) {
      filtered = filtered.filter(lawyer => 
        lawyer.specialties.some(specialty => selectedSpecialties.includes(specialty))
      );
    }
    
    // Filter by selected languages
    if (selectedLanguages.length > 0) {
      filtered = filtered.filter(lawyer => 
        lawyer.languages.some(language => selectedLanguages.includes(language))
      );
    }
    
    // Filter by selected locations
    if (selectedLocations.length > 0) {
      filtered = filtered.filter(lawyer => 
        selectedLocations.includes(lawyer.location)
      );
    }
    
    // Filter by price range
    filtered = filtered.filter(lawyer => 
      lawyer.price >= priceRange[0] && lawyer.price <= priceRange[1]
    );
    
    // Filter by availability
    if (availabilityDays.length > 0) {
      filtered = filtered.filter(lawyer => 
        availabilityDays.some(day => lawyer.availability.includes(day))
      );
    }
    
    // Sort lawyers
    switch (sortOption) {
      case 'rating_high':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating_low':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'reviews':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      default:
        break;
    }
    
    setFilteredLawyers(filtered);
  }, [
    searchQuery, 
    selectedSpecialties, 
    selectedLanguages, 
    selectedLocations, 
    priceRange, 
    availabilityDays, 
    sortOption,
    isLoading
  ]);
  
  // Handle toggling a specialty filter
  const toggleSpecialty = (specialty: string) => {
    if (selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties(selectedSpecialties.filter(s => s !== specialty));
    } else {
      setSelectedSpecialties([...selectedSpecialties, specialty]);
    }
  };
  
  // Handle toggling a language filter
  const toggleLanguage = (language: string) => {
    if (selectedLanguages.includes(language)) {
      setSelectedLanguages(selectedLanguages.filter(l => l !== language));
    } else {
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };
  
  // Handle toggling a location filter
  const toggleLocation = (location: string) => {
    if (selectedLocations.includes(location)) {
      setSelectedLocations(selectedLocations.filter(l => l !== location));
    } else {
      setSelectedLocations([...selectedLocations, location]);
    }
  };
  
  // Handle toggling an availability day
  const toggleAvailabilityDay = (day: string) => {
    if (availabilityDays.includes(day)) {
      setAvailabilityDays(availabilityDays.filter(d => d !== day));
    } else {
      setAvailabilityDays([...availabilityDays, day]);
    }
  };
  
  // Handle price range change
  const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setPriceRange([value, priceRange[1]]);
  };
  
  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setPriceRange([priceRange[0], value]);
  };
  
  // Handle clearing all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSpecialties([]);
    setSelectedLanguages([]);
    setSelectedLocations([]);
    setPriceRange([0, 500]);
    setAvailabilityDays([]);
    setSortOption('rating_high');
  };
  
  // Render star rating
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="text-yellow-400" />
        ))}
        {hasHalfStar && <FaStar className="text-yellow-400" />}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <FaStar key={`empty-${i}`} className="text-gray-300" />
        ))}
      </div>
    );
  };
  
  // Count active filters
  const activeFilterCount = 
    selectedSpecialties.length + 
    selectedLanguages.length + 
    selectedLocations.length + 
    availabilityDays.length + 
    (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0);
  
  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Find a Lawyer</h1>
        
        {/* Search and filter bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by name, specialty, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 font-medium text-gray-700"
          >
            <FaFilter className="mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-indigo-600 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          
          <div className="flex-shrink-0 w-52">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="rating_high">Highest Rated</option>
              <option value="rating_low">Lowest Rated</option>
              <option value="price_high">Price: High to Low</option>
              <option value="price_low">Price: Low to High</option>
              <option value="reviews">Most Reviews</option>
            </select>
          </div>
        </div>
        
        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Filters</h2>
              <button
                onClick={clearAllFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Clear all filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Specialty filter */}
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <FaGavel className="mr-2 text-indigo-600" />
                  Specialties
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {specialtyOptions.map((specialty) => (
                    <label key={specialty} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedSpecialties.includes(specialty)}
                        onChange={() => toggleSpecialty(specialty)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Languages filter */}
              <div>
                <h3 className="font-medium mb-2">Languages</h3>
                <div className="space-y-2">
                  {languageOptions.map((language) => (
                    <label key={language} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(language)}
                        onChange={() => toggleLanguage(language)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{language}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Location filter */}
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-indigo-600" />
                  Location
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {locationOptions.map((location) => (
                    <label key={location} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(location)}
                        onChange={() => toggleLocation(location)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{location}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Price Range filter */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <FaMoneyBillWave className="mr-2 text-indigo-600" />
                    Price Range (per hour)
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-700 w-16">Min: ${priceRange[0]}</span>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="25"
                        value={priceRange[0]}
                        onChange={handlePriceMinChange}
                        className="flex-grow mx-2 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-700 w-16">Max: ${priceRange[1]}</span>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="25"
                        value={priceRange[1]}
                        onChange={handlePriceMaxChange}
                        className="flex-grow mx-2 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Availability filter */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <FaClock className="mr-2 text-indigo-600" />
                    Availability
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {daysOfWeek.map((day) => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={availabilityDays.includes(day)}
                          onChange={() => toggleAvailabilityDay(day)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Results summary */}
        <div className="my-4 text-gray-600">
          Found {filteredLawyers.length} lawyers{searchQuery ? ` matching "${searchQuery}"` : ''}
        </div>
        
        {/* Lawyers grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredLawyers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-2">No lawyers found</h2>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search query to find more results.
            </p>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLawyers.map((lawyer) => (
              <Link 
                href={`/lawyers/${lawyer.id}`}
                key={lawyer.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start mb-4">
                    <img
                      src={lawyer.image}
                      alt={lawyer.name}
                      className="h-20 w-20 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h2 className="text-xl font-medium text-gray-900">{lawyer.name}</h2>
                      <div className="mt-1 flex items-center">
                        {renderStars(lawyer.rating)}
                        <span className="ml-2 text-sm text-gray-600">
                          {lawyer.rating} ({lawyer.reviewCount} reviews)
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-gray-600">
                        <FaMapMarkerAlt className="mr-1" />
                        <span className="text-sm">{lawyer.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {lawyer.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-medium text-indigo-600">${lawyer.price}/hr</div>
                    <div className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                      View Profile
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 