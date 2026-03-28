'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaStar, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaCheck, FaLanguage, FaGraduationCap, FaUserTie, FaSpinner, FaChevronLeft } from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';

// Mock data for lawyers (same as in the listings page)
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
  education?: string[];
  certifications?: string[];
  reviews?: Array<{
    id: string;
    author: string;
    date: string;
    rating: number;
    comment: string;
  }>;
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
    education: [
      'J.D., Harvard Law School',
      'B.A. in Economics, Yale University'
    ],
    certifications: [
      'American Bar Association',
      'New York State Bar Association',
      'Certified Corporate Law Specialist'
    ],
    reviews: [
      {
        id: 'review-1',
        author: 'John Smith',
        date: '2023-03-15',
        rating: 5,
        comment: 'Sarah provided excellent guidance for our startup. Her expertise in corporate law helped us avoid several potential legal issues during our formation process.'
      },
      {
        id: 'review-2',
        author: 'Emma Davis',
        date: '2023-02-22',
        rating: 4.5,
        comment: 'Very knowledgeable and professional. Sarah helped us negotiate and review a complex contract. Highly recommended for any business legal needs.'
      },
      {
        id: 'review-3',
        author: 'Michael Wilson',
        date: '2023-01-10',
        rating: 5,
        comment: 'We've been working with Sarah for over 3 years on various corporate matters. She consistently provides sound legal advice and is always responsive.'
      }
    ]
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
    education: [
      'J.D., Stanford Law School',
      'M.S. in Computer Science, MIT',
      'B.S. in Electrical Engineering, UC Berkeley'
    ],
    certifications: [
      'Registered Patent Attorney, USPTO',
      'California State Bar Association',
      'Certified IP Specialist'
    ],
    reviews: [
      {
        id: 'review-1',
        author: 'David Kim',
        date: '2023-04-05',
        rating: 5,
        comment: 'Michael's background in both technology and law makes him an exceptional patent attorney. He helped us secure multiple patents for our software innovations.'
      },
      {
        id: 'review-2',
        author: 'Lisa Wong',
        date: '2023-03-12',
        rating: 5,
        comment: 'Incredibly knowledgeable about tech IP law. Michael guided our startup through the complex patent application process with expertise and clarity.'
      }
    ]
  },
  // Additional lawyers data remains the same as in the listings page
];

export default function LawyerProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useParams();
  
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [nextAvailableDates, setNextAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [consultationTopic, setConsultationTopic] = useState('');
  
  useEffect(() => {
    if (id) {
      // Find lawyer from our mock data
      const foundLawyer = lawyers.find(l => l.id === id);
      
      // Simulate API call
      setTimeout(() => {
        setLawyer(foundLawyer || null);
        setIsLoading(false);
        
        // Generate next 14 days available dates
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dates: string[] = [];
        const today = new Date();
        
        for (let i = 1; i <= 14; i++) {
          const date = new Date();
          date.setDate(today.getDate() + i);
          const dayName = days[date.getDay()];
          
          // Check if the lawyer is available on this day
          if (foundLawyer && foundLawyer.availability.includes(dayName)) {
            dates.push(date.toISOString().split('T')[0]);
          }
        }
        
        setNextAvailableDates(dates);
      }, 1000);
    }
  }, [id]);
  
  useEffect(() => {
    // Set available times when a date is selected
    if (selectedDate) {
      // Generate time slots from 9 AM to 5 PM
      const times = [];
      for (let hour = 9; hour <= 17; hour++) {
        // Skip lunch hour (12-1 PM)
        if (hour !== 12) {
          times.push(`${hour}:00`);
          if (hour !== 17) {
            times.push(`${hour}:30`);
          }
        }
      }
      
      // Simulate some times being already booked
      const bookedTimes = ['10:00', '14:30', '16:00'];
      setAvailableTimes(times.filter(time => !bookedTimes.includes(time)));
    }
  }, [selectedDate]);
  
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };
  
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };
  
  const handleBookAppointment = () => {
    if (!user) {
      router.push(`/login?redirect=/lawyers/${id}`);
      return;
    }
    
    if (!selectedDate || !selectedTime || !consultationTopic.trim()) {
      alert('Please select a date, time, and enter a consultation topic');
      return;
    }
    
    // Simulate API call to book appointment
    setIsLoading(true);
    setTimeout(() => {
      setBookingSuccess(true);
      setIsLoading(false);
    }, 1500);
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
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
  
  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
        <FaSpinner className="animate-spin text-indigo-600 mr-2" />
        <span>Loading lawyer profile...</span>
      </div>
    );
  }
  
  if (!lawyer) {
    return (
      <div className="min-h-screen pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Lawyer Not Found</h1>
            <p className="text-gray-600 mb-6">
              The lawyer you are looking for does not exist or may have been removed.
            </p>
            <Link
              href="/lawyers"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <FaChevronLeft className="mr-2" />
              Back to Lawyers
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (bookingSuccess) {
    return (
      <div className="min-h-screen pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600 mb-6">
              Your consultation with {lawyer.name} has been scheduled for:
            </p>
            <div className="inline-block bg-indigo-50 px-4 py-3 rounded-lg mb-6">
              <p className="font-medium text-indigo-800">
                {formatDate(selectedDate || '')} at {selectedTime}
              </p>
            </div>
            <p className="text-gray-600 mb-8">
              You will receive a confirmation email with details and instructions for your consultation.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/user/appointments"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                View My Appointments
              </Link>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6">
          <Link
            href="/lawyers"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <FaChevronLeft className="mr-2" />
            Back to Lawyers
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Lawyer Info */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center">
                  <img
                    src={lawyer.image}
                    alt={lawyer.name}
                    className="h-24 w-24 rounded-full object-cover mr-6"
                  />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{lawyer.name}</h1>
                    <div className="flex items-center mt-1">
                      <div className="flex mr-1">{renderStars(lawyer.rating)}</div>
                      <span className="text-sm text-gray-600">
                        {lawyer.rating} ({lawyer.reviewCount} reviews)
                      </span>
                    </div>
                    <div className="flex items-center mt-2 text-gray-600">
                      <FaMapMarkerAlt className="mr-2" />
                      {lawyer.location}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-3">About</h2>
                  <p className="text-gray-700">{lawyer.bio}</p>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <FaUserTie className="mr-2 text-indigo-600" />
                      Specialties
                    </h3>
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
                  
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <FaLanguage className="mr-2 text-indigo-600" />
                      Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {lawyer.languages.map((language) => (
                        <span
                          key={language}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Education and Certifications */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Credentials</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <FaGraduationCap className="mr-2 text-indigo-600" />
                      Education
                    </h3>
                    <ul className="space-y-2">
                      {lawyer.education?.map((edu, index) => (
                        <li key={index} className="flex items-start">
                          <FaCheck className="text-green-500 mt-1 mr-2" />
                          <span>{edu}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <FaCheck className="mr-2 text-indigo-600" />
                      Certifications
                    </h3>
                    <ul className="space-y-2">
                      {lawyer.certifications?.map((cert, index) => (
                        <li key={index} className="flex items-start">
                          <FaCheck className="text-green-500 mt-1 mr-2" />
                          <span>{cert}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Reviews */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Client Reviews</h2>
                
                {lawyer.reviews && lawyer.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {lawyer.reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between mb-2">
                          <div className="font-medium">{review.author}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(review.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex mb-2">{renderStars(review.rating)}</div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No reviews yet.</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Booking Widget */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-32">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Book a Consultation</h2>
                
                <div className="flex items-center justify-between mb-6 pb-6 border-b">
                  <div>
                    <span className="block text-gray-500 text-sm">Consultation Fee</span>
                    <span className="text-2xl font-bold text-gray-900">${lawyer.price}</span>
                    <span className="text-gray-500">/hour</span>
                  </div>
                  <div className="bg-indigo-100 text-indigo-800 py-1 px-3 rounded-full text-sm">
                    {lawyer.experience} years exp.
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation Topic
                  </label>
                  <textarea
                    value={consultationTopic}
                    onChange={(e) => setConsultationTopic(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Briefly describe what you'd like to discuss..."
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaCalendarAlt className="inline-block mr-2" />
                    Select a Date
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {nextAvailableDates.slice(0, 6).map((date) => (
                      <button
                        key={date}
                        onClick={() => handleDateSelect(date)}
                        className={`py-2 px-3 rounded-md text-sm ${
                          selectedDate === date
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {new Date(date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </button>
                    ))}
                  </div>
                </div>
                
                {selectedDate && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaClock className="inline-block mr-2" />
                      Select a Time
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {availableTimes.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className={`py-2 px-1 rounded-md text-xs ${
                            selectedTime === time
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleBookAppointment}
                  disabled={!selectedDate || !selectedTime || !consultationTopic.trim()}
                  className={`w-full py-3 px-4 rounded-md font-medium ${
                    !selectedDate || !selectedTime || !consultationTopic.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  Book Appointment
                </button>
                
                <p className="text-sm text-gray-500 mt-4 text-center">
                  You won't be charged until after the consultation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 