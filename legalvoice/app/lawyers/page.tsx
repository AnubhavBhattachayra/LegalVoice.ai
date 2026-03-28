'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaStar, FaMapMarkerAlt, FaSearch, FaFilter, FaSort, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

// Mock data for lawyers
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
  bio: string;
  languages: string[];
  experience: number;
}

const lawyers: Lawyer[] = [
  {
    id: 'lawyer-1',
    name: 'Sarah Johnson',
    image: 'https://randomuser.me/api/portraits/women/33.jpg',
    specialties: ['Corporate Law', 'Contract Law', 'Business Formation'],
    rating: 4.8,
    reviewCount: 127,
    location: 'New York, NY',
    price: 200,
    availability: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
    bio: 'Corporate attorney with 15 years of experience helping startups and established businesses navigate legal challenges.',
    languages: ['English', 'Spanish'],
    experience: 15,
  },
  {
    id: 'lawyer-2',
    name: 'Michael Chen',
    image: 'https://randomuser.me/api/portraits/men/45.jpg',
    specialties: ['Intellectual Property', 'Patent Law', 'Technology'],
    rating: 4.9,
    reviewCount: 93,
    location: 'San Francisco, CA',
    price: 250,
    availability: ['Monday', 'Wednesday', 'Friday'],
    bio: 'Patent attorney and former software engineer specializing in helping tech companies protect their intellectual property.',
    languages: ['English', 'Mandarin'],
    experience: 12,
  },
  {
    id: 'lawyer-3',
    name: 'Robert Williams',
    image: 'https://randomuser.me/api/portraits/men/22.jpg',
    specialties: ['Tax Law', 'Estate Planning', 'Wealth Management'],
    rating: 4.6,
    reviewCount: 78,
    location: 'Chicago, IL',
    price: 180,
    availability: ['Tuesday', 'Thursday', 'Friday'],
    bio: 'Tax attorney with expertise in estate planning and wealth management strategies for individuals and small businesses.',
    languages: ['English'],
    experience: 20,
  },
  {
    id: 'lawyer-4',
    name: 'Jennifer Lopez',
    image: 'https://randomuser.me/api/portraits/women/45.jpg',
    specialties: ['Family Law', 'Divorce', 'Child Custody'],
    rating: 4.7,
    reviewCount: 152,
    location: 'Los Angeles, CA',
    price: 220,
    availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    bio: 'Compassionate family law attorney specializing in divorce, child custody, and related matters. Certified mediator.',
    languages: ['English', 'Spanish'],
    experience: 18,
  },
  {
    id: 'lawyer-5',
    name: 'David Kim',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    specialties: ['Immigration Law', 'Visa Applications', 'Citizenship'],
    rating: 4.9,
    reviewCount: 201,
    location: 'Seattle, WA',
    price: 190,
    availability: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
    bio: 'Immigration attorney with a perfect success rate for green card applications. Former immigration officer.',
    languages: ['English', 'Korean', 'Japanese'],
    experience: 10,
  },
  {
    id: 'lawyer-6',
    name: 'Aisha Patel',
    image: 'https://randomuser.me/api/portraits/women/65.jpg',
    specialties: ['Labor Law', 'Employment Disputes', 'Workplace Discrimination'],
    rating: 4.7,
    reviewCount: 88,
    location: 'Austin, TX',
    price: 175,
    availability: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    bio: 'Employment attorney advocating for fair workplace practices. Experience representing both employees and employers.',
    languages: ['English', 'Hindi', 'Gujarati'],
    experience: 14,
  },
];

// Specialty options for filtering
const specialtyOptions = [
  'Corporate Law',
  'Contract Law',
  'Business Formation',
  'Intellectual Property',
  'Patent Law',
  'Technology',
  'Tax Law',
  'Estate Planning',
  'Wealth Management',
  'Family Law',
  'Divorce',
  'Child Custody',
  'Immigration Law',
  'Visa Applications',
  'Citizenship',
  'Labor Law',
  'Employment Disputes',
  'Workplace Discrimination',
];

export default function LawyersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300]);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('rating');
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filtered lawyers
  const [filteredLawyers, setFilteredLawyers] = useState<Lawyer[]>(lawyers);

  // Apply filters
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      let results = [...lawyers];
      
      // Apply search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        results = results.filter(
          (lawyer) =>
            lawyer.name.toLowerCase().includes(searchLower) ||
            lawyer.specialties.some((s) => s.toLowerCase().includes(searchLower)) ||
            lawyer.location.toLowerCase().includes(searchLower) ||
            lawyer.bio.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply specialty filters
      if (selectedSpecialties.length > 0) {
        results = results.filter((lawyer) =>
          lawyer.specialties.some((specialty) => selectedSpecialties.includes(specialty))
        );
      }
      
      // Apply price range filter
      results = results.filter(
        (lawyer) => lawyer.price >= priceRange[0] && lawyer.price <= priceRange[1]
      );
      
      // Apply rating filter
      if (ratingFilter !== null) {
        results = results.filter((lawyer) => lawyer.rating >= ratingFilter);
      }
      
      // Apply sorting
      results.sort((a, b) => {
        switch (sortBy) {
          case 'rating':
            return b.rating - a.rating;
          case 'price_low':
            return a.price - b.price;
          case 'price_high':
            return b.price - a.price;
          case 'experience':
            return b.experience - a.experience;
          default:
            return 0;
        }
      });
      
      setFilteredLawyers(results);
      setIsLoading(false);
    }, 500);
  }, [searchTerm, selectedSpecialties, priceRange, ratingFilter, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with search parameters
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    router.push(`/lawyers?${params.toString()}`);
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const handlePriceRangeChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = parseInt(e.target.value);
    setPriceRange((prev) => {
      const newRange = [...prev] as [number, number];
      newRange[index] = value;
      return newRange;
    });
  };

  const handleRatingFilterChange = (rating: number) => {
    setRatingFilter((prev) => (prev === rating ? null : rating));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const handleClearFilters = () => {
    setSelectedSpecialties([]);
    setPriceRange([0, 300]);
    setRatingFilter(null);
    setSortBy('rating');
  };

  const toggleFilters = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i - 0.5 <= rating) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaStar key={i} className="text-gray-300" />);
      }
    }
    return stars;
  };

  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Find a Lawyer</h1>
          <p className="mt-2 text-gray-600">
            Connect with experienced legal professionals specializing in various areas of law
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, specialty, or location"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={toggleFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
              >
                <FaFilter className="mr-2" />
                Filters
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Search
              </button>
            </div>
          </form>

          {/* Filters Panel */}
          {isFilterOpen && (
            <div className="mt-6 border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Filters</h3>
            <button
                  onClick={handleClearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
            >
                  Clear all filters
            </button>
          </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Specialties */}
                <div>
                  <h4 className="font-medium mb-2">Specialties</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {specialtyOptions.map((specialty) => (
                      <div key={specialty} className="flex items-center">
                        <input
                          id={`specialty-${specialty}`}
                          type="checkbox"
                          checked={selectedSpecialties.includes(specialty)}
                          onChange={() => handleSpecialtyToggle(specialty)}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label
                          htmlFor={`specialty-${specialty}`}
                          className="ml-2 text-sm text-gray-700"
                        >
                          {specialty}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="font-medium mb-2">Price Range</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="0"
                        max="300"
                        value={priceRange[0]}
                        onChange={(e) => handlePriceRangeChange(e, 0)}
                        className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="range"
                        min="0"
                        max="300"
                        value={priceRange[1]}
                        onChange={(e) => handlePriceRangeChange(e, 1)}
                        className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Rating and Sort */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Minimum Rating</h4>
                    <div className="flex space-x-2">
                      {[4, 4.5, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => handleRatingFilterChange(rating)}
                          className={`flex items-center px-3 py-1 rounded-full text-sm ${
                            ratingFilter === rating
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}
                        >
                          {rating}+ <FaStar className="ml-1 text-yellow-400" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Sort By</h4>
                  <select 
                      value={sortBy}
                      onChange={handleSortChange}
                      className="block w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="rating">Highest Rated</option>
                      <option value="price_low">Lowest Price</option>
                      <option value="price_high">Highest Price</option>
                      <option value="experience">Most Experienced</option>
                  </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-medium">
            {isLoading ? 'Searching...' : `${filteredLawyers.length} lawyers found`}
          </h2>
          <div className="flex items-center text-sm text-gray-600">
            <FaSort className="mr-2" />
            <span className="mr-2">Sort by:</span>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="border-none bg-transparent focus:ring-0 focus:outline-none"
            >
              <option value="rating">Highest Rated</option>
              <option value="price_low">Lowest Price</option>
              <option value="price_high">Highest Price</option>
              <option value="experience">Most Experienced</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="animate-spin text-indigo-600 mr-2" />
            <span>Searching for lawyers...</span>
          </div>
        ) : filteredLawyers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaTimes className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Lawyers Found</h3>
            <p className="text-gray-600 mb-6">
              We couldn't find any lawyers matching your criteria. Try adjusting your filters or search term.
            </p>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLawyers.map((lawyer) => (
              <div key={lawyer.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <img 
                      src={lawyer.image} 
                      alt={lawyer.name}
                      className="h-16 w-16 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h3 className="font-bold text-lg">{lawyer.name}</h3>
                      <div className="flex items-center mt-1">
                        <div className="flex mr-1">{renderStars(lawyer.rating)}</div>
                        <span className="text-sm text-gray-600">
                          {lawyer.rating} ({lawyer.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-start mb-2">
                      <FaMapMarkerAlt className="text-gray-400 mt-1 mr-2" />
                      <span>{lawyer.location}</span>
                    </div>
                    <p className="text-gray-700 text-sm mb-3">{lawyer.bio}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {lawyer.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                    <div className="text-gray-700 font-medium">
                      ${lawyer.price}/hour
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {lawyer.experience} years experience
                    </div>
                    <Link 
                      href={`/lawyers/${lawyer.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 