'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaStar, FaChevronLeft, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';

interface Lawyer {
  id: string;
  name: string;
  image: string;
  specialty: string;
}

interface Appointment {
  id: string;
  lawyerId: string;
  lawyerName: string;
  date: string;
  time: string;
  topic: string;
}

export default function LawyerReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const { user, isLoading: authLoading } = useAuth();
  
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  
  // Review form state
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [expertise, setExpertise] = useState<number>(0);
  const [communication, setCommunication] = useState<number>(0);
  const [responsiveness, setResponsiveness] = useState<number>(0);
  const [value, setValue] = useState<number>(0);
  
  useEffect(() => {
    if (!user && !authLoading) {
      router.push(`/login?redirect=/lawyers/${params.id}/review?appointmentId=${appointmentId}`);
      return;
    }
    
    if (user) {
      // Simulate fetching lawyer and appointment data
      setTimeout(() => {
        setLawyer({
          id: params.id,
          name: 'Sarah Johnson',
          image: 'https://randomuser.me/api/portraits/women/33.jpg',
          specialty: 'Corporate Law',
        });
        
        setAppointment({
          id: appointmentId || 'appt-1',
          lawyerId: params.id,
          lawyerName: 'Sarah Johnson',
          date: '2023-04-20',
          time: '14:30',
          topic: 'Startup incorporation advice',
        });
        
        setIsLoading(false);
      }, 1000);
    }
  }, [user, authLoading, router, params.id, appointmentId]);
  
  const handleStarClick = (value: number) => {
    setRating(value);
  };
  
  const handleStarHover = (value: number) => {
    setHoverRating(value);
  };
  
  const handleCriteriaChange = (
    criteria: 'expertise' | 'communication' | 'responsiveness' | 'value',
    value: number
  ) => {
    switch (criteria) {
      case 'expertise':
        setExpertise(value);
        break;
      case 'communication':
        setCommunication(value);
        break;
      case 'responsiveness':
        setResponsiveness(value);
        break;
      case 'value':
        setValue(value);
        break;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please provide an overall rating');
      return;
    }
    
    setSubmitLoading(true);
    
    // Simulate API call to submit review
    try {
      // In a real app, you would send this data to your backend
      const reviewData = {
        lawyerId: params.id,
        appointmentId,
        rating,
        expertise,
        communication,
        responsiveness,
        value,
        comment,
        userId: user?.id,
        userName: user?.name || 'Anonymous',
        date: new Date().toISOString(),
      };
      
      console.log('Submitting review:', reviewData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmitSuccess(true);
      setSubmitLoading(false);
      
      // Redirect after success
      setTimeout(() => {
        router.push(`/lawyers/${params.id}`);
      }, 2000);
    } catch (error) {
      console.error('Error submitting review:', error);
      setSubmitError(true);
      setSubmitLoading(false);
    }
  };
  
  const renderStars = (
    currentRating: number,
    hoverRatingState: number,
    onClickFn: (rating: number) => void,
    onHoverFn?: (rating: number) => void
  ) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onClickFn(star)}
            onMouseEnter={onHoverFn ? () => onHoverFn(star) : undefined}
            onMouseLeave={onHoverFn ? () => onHoverFn(0) : undefined}
            className="text-2xl p-1 focus:outline-none"
          >
            <FaStar
              className={`${
                star <= (hoverRatingState || currentRating)
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
        <FaSpinner className="animate-spin text-indigo-600 mr-2" />
        <span>Loading...</span>
      </div>
    );
  }
  
  if (!user) {
    return null; // Will redirect to login in useEffect
  }
  
  if (submitSuccess) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <FaCheck className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Thank You!</h2>
          <p className="mt-2 text-gray-600">
            Your review has been submitted successfully.
          </p>
          <div className="mt-6">
            <Link
              href={`/lawyers/${params.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Return to Lawyer Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link
          href={`/lawyers/${params.id}`}
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <FaChevronLeft className="mr-2" />
          Back to Profile
        </Link>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Review your consultation
            </h1>
            
            {appointment && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start">
                  {lawyer?.image && (
                    <img
                      src={lawyer.image}
                      alt={lawyer.name}
                      className="h-12 w-12 rounded-full object-cover mr-4"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{lawyer?.name}</h3>
                    <p className="text-gray-600 text-sm">{lawyer?.specialty}</p>
                    <p className="text-gray-600 text-sm mt-1">
                      {formatDate(appointment.date)} at {appointment.time}
                    </p>
                    <p className="text-gray-700 mt-2">{appointment.topic}</p>
                  </div>
                </div>
              </div>
            )}
            
            {submitError && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg text-red-800 flex items-center">
                <FaExclamationTriangle className="mr-2" />
                <span>
                  There was an error submitting your review. Please try again.
                </span>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Rating
                  </label>
                  <div className="flex items-center">
                    {renderStars(rating, hoverRating, handleStarClick, handleStarHover)}
                    <span className="ml-2 text-sm text-gray-500">
                      {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select a rating'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Rate your experience</h3>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm text-gray-700">Expertise</label>
                      <span className="text-xs text-gray-500">
                        {expertise > 0 ? `${expertise}/5` : 'Not rated'}
                      </span>
                    </div>
                    <div className="flex">
                      {renderStars(expertise, 0, (value) => handleCriteriaChange('expertise', value))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm text-gray-700">Communication</label>
                      <span className="text-xs text-gray-500">
                        {communication > 0 ? `${communication}/5` : 'Not rated'}
                      </span>
                    </div>
                    <div className="flex">
                      {renderStars(communication, 0, (value) => handleCriteriaChange('communication', value))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm text-gray-700">Responsiveness</label>
                      <span className="text-xs text-gray-500">
                        {responsiveness > 0 ? `${responsiveness}/5` : 'Not rated'}
                      </span>
                    </div>
                    <div className="flex">
                      {renderStars(responsiveness, 0, (value) => handleCriteriaChange('responsiveness', value))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm text-gray-700">Value for Money</label>
                      <span className="text-xs text-gray-500">
                        {value > 0 ? `${value}/5` : 'Not rated'}
                      </span>
                    </div>
                    <div className="flex">
                      {renderStars(value, 0, (value) => handleCriteriaChange('value', value))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Share your experience with this lawyer..."
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.push(`/lawyers/${params.id}`)}
                    className="mr-4 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading || rating === 0}
                    className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center"
                  >
                    {submitLoading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
} 