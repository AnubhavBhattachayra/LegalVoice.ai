'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaCalendar, FaClock, FaUser, FaBuilding, FaGraduationCap, FaStar } from 'react-icons/fa';

interface Lawyer {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  reviews: number;
  firm: string;
  education: string;
  availability: {
    [key: string]: {
      start: string;
      end: string;
    }[];
  };
  hourlyRate: number;
  imageUrl: string;
}

interface BookingSlot {
  date: string;
  time: string;
  lawyerId: string;
  available: boolean;
}

export default function Consultation() {
  const { user } = useAuth();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingSlots, setBookingSlots] = useState<BookingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchLawyers();
  }, []);

  useEffect(() => {
    if (selectedLawyer && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedLawyer, selectedDate]);

  const fetchLawyers = async () => {
    try {
      const response = await fetch('/api/lawyers');
      if (!response.ok) {
        throw new Error('Failed to fetch lawyers');
      }
      const data = await response.json();
      setLawyers(data);
    } catch (error) {
      setError('Failed to load lawyers');
      console.error('Error fetching lawyers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await fetch(
        `/api/booking-slots?lawyerId=${selectedLawyer?.id}&date=${selectedDate}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }
      const data = await response.json();
      setBookingSlots(data);
    } catch (error) {
      setError('Failed to load available slots');
      console.error('Error fetching slots:', error);
    }
  };

  const handleBooking = async () => {
    if (!selectedLawyer || !selectedDate || !selectedTime || !user) {
      return;
    }

    try {
      const response = await fetch('/api/book-consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lawyerId: selectedLawyer.id,
          date: selectedDate,
          time: selectedTime,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to book consultation');
      }

      setBookingSuccess(true);
      // Reset selections
      setSelectedDate(null);
      setSelectedTime(null);
      setBookingSlots([]);
    } catch (error) {
      setError('Failed to book consultation');
      console.error('Booking error:', error);
    }
  };

  const getNextAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Exclude weekends
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Book a Legal Consultation</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {bookingSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Consultation booked successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lawyer Selection */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Select a Lawyer</h2>
          <div className="space-y-4">
            {lawyers.map((lawyer) => (
              <div
                key={lawyer.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedLawyer?.id === lawyer.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:border-blue-300'
                }`}
                onClick={() => setSelectedLawyer(lawyer)}
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={lawyer.imageUrl}
                    alt={lawyer.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{lawyer.name}</h3>
                    <p className="text-gray-600">{lawyer.specialization}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center">
                        <FaBuilding className="text-gray-500 mr-1" />
                        <span className="text-sm text-gray-600">{lawyer.firm}</span>
                      </div>
                      <div className="flex items-center">
                        <FaGraduationCap className="text-gray-500 mr-1" />
                        <span className="text-sm text-gray-600">{lawyer.education}</span>
                      </div>
                    </div>
                    <div className="flex items-center mt-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`${
                              i < lawyer.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        ({lawyer.reviews} reviews)
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-blue-600 font-semibold">
                        ${lawyer.hourlyRate}/hour
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Form */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Select Date & Time</h2>
          {selectedLawyer ? (
            <div className="space-y-4">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {getNextAvailableDates().map((date) => (
                    <button
                      key={date}
                      className={`p-2 border rounded-lg text-sm ${
                        selectedDate === date
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedDate(date)}
                    >
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {bookingSlots.map((slot) => (
                      <button
                        key={slot.time}
                        className={`p-2 border rounded-lg text-sm ${
                          selectedTime === slot.time
                            ? 'border-blue-500 bg-blue-50'
                            : slot.available
                            ? 'hover:border-blue-300'
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking Button */}
              {selectedDate && selectedTime && (
                <button
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                  onClick={handleBooking}
                >
                  Book Consultation
                </button>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Please select a lawyer to continue</p>
          )}
        </div>
      </div>
    </div>
  );
} 