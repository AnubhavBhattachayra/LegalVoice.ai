'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaCalendarAlt, FaClock, FaComment, FaGavel, FaMoneyBillWave, FaUser, FaCheck } from 'react-icons/fa';

export default function BookConsultation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lawyerId = searchParams.get('id');
  
  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [consultationType, setConsultationType] = useState('video');
  const [legalIssue, setLegalIssue] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  
  useEffect(() => {
    // In a real application, fetch the lawyer data from API
    // For demo purposes, we're using sample data
    const fetchLawyer = async () => {
      setLoading(true);
      try {
        // Simulate API call
        setTimeout(() => {
          // Sample lawyer data
          const lawyerData = {
            id: lawyerId || '1',
            name: 'Adv. Priya Sharma',
            image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
            specialization: 'Criminal Law',
            experience: '15 years',
            location: 'Delhi',
            languages: ['English', 'Hindi'],
            rating: 4.8,
            reviews: 127,
            fees: 2500,
            description: 'Specialized in criminal defense and has handled numerous high-profile cases. Known for her strategic approach and thorough case preparation.',
            availability: {
              monday: { available: true, from: '10:00', to: '17:00' },
              tuesday: { available: true, from: '10:00', to: '17:00' },
              wednesday: { available: true, from: '10:00', to: '17:00' },
              thursday: { available: true, from: '10:00', to: '17:00' },
              friday: { available: true, from: '10:00', to: '17:00' },
              saturday: { available: true, from: '10:00', to: '13:00' },
              sunday: { available: false, from: '', to: '' }
            }
          };
          
          setLawyer(lawyerData);
          generateAvailableDates();
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching lawyer details:', error);
        setLoading(false);
      }
    };
    
    fetchLawyer();
  }, [lawyerId]);
  
  // Generate next 14 available dates
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip adding weekends if needed
      const day = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      // Only add days when the lawyer is available
      // In a real app, this would check against the lawyer's actual availability
      if (day !== 'sunday') {
        dates.push({
          date: date.toISOString().split('T')[0],
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayOfMonth: date.getDate(),
          month: date.toLocaleDateString('en-US', { month: 'short' })
        });
      }
    }
    
    setAvailableDates(dates);
  };
  
  // Generate time slots based on selected date
  useEffect(() => {
    if (!selectedDate || !lawyer) return;
    
    const date = new Date(selectedDate);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Check if lawyer is available on this day
    const dayAvailability = lawyer.availability[dayOfWeek];
    
    if (!dayAvailability || !dayAvailability.available) {
      setTimeSlots([]);
      return;
    }
    
    // Generate 30-minute slots between the available hours
    const slots = [];
    const startTime = dayAvailability.from;
    const endTime = dayAvailability.to;
    
    let current = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    while (current < end) {
      const timeString = current.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      slots.push(timeString);
      current.setMinutes(current.getMinutes() + 30);
    }
    
    setTimeSlots(slots);
  }, [selectedDate, lawyer]);
  
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot('');
  };
  
  const handleConfirmBooking = () => {
    // In a real app, you would send this data to your API
    console.log('Booking confirmed with details:', {
      lawyerId: lawyer?.id,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      consultationType,
      legalIssue
    });
    
    // Simulate API call and show confirmation
    setTimeout(() => {
      setBookingConfirmed(true);
    }, 1000);
  };
  
  if (loading) {
    return (
      <main className="min-h-screen pt-32 pb-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
              <div className="h-40 bg-gray-200 rounded mb-6"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }
  
  if (bookingConfirmed) {
    return (
      <main className="min-h-screen pt-32 pb-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
              <FaCheck className="text-green-600 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-2">Consultation Booked Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your consultation with {lawyer?.name} has been confirmed for {selectedDate} at {selectedTimeSlot}.
            </p>
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <FaCalendarAlt className="text-indigo-600 mr-2" />
                  <span className="text-gray-700">{selectedDate}</span>
                </div>
                <div className="flex items-center">
                  <FaClock className="text-indigo-600 mr-2" />
                  <span className="text-gray-700">{selectedTimeSlot}</span>
                </div>
                <div className="flex items-center">
                  <FaUser className="text-indigo-600 mr-2" />
                  <span className="text-gray-700">{lawyer?.name}</span>
                </div>
                <div className="flex items-center">
                  <FaGavel className="text-indigo-600 mr-2" />
                  <span className="text-gray-700">{lawyer?.specialization}</span>
                </div>
                <div className="flex items-center">
                  <FaMoneyBillWave className="text-indigo-600 mr-2" />
                  <span className="text-gray-700">₹{lawyer?.fees}</span>
                </div>
                <div className="flex items-center">
                  <FaComment className="text-indigo-600 mr-2" />
                  <span className="text-gray-700">{consultationType} consultation</span>
                </div>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              You will receive a confirmation email with further details and instructions for your consultation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/lawyers" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200">
                Back to Lawyers
              </Link>
              <button className="px-6 py-2 bg-white border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition duration-200">
                View My Bookings
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/lawyers" className="flex items-center text-indigo-600 mb-6 hover:text-indigo-800">
          <FaArrowLeft className="mr-2" /> Back to Lawyers
        </Link>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-3xl font-bold text-gray-800">Book a Consultation</h2>
            <p className="text-gray-600 mt-2">
              Schedule a consultation with a legal expert to discuss your case and get professional advice.
            </p>
          </div>
          
          {lawyer && (
            <div className="p-6 flex flex-col md:flex-row gap-6 bg-indigo-50 border-b border-indigo-100">
              <img 
                src={lawyer.image} 
                alt={lawyer.name}
                className="w-24 h-24 rounded-full object-cover self-center md:self-start"
              />
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{lawyer.name}</h3>
                <div className="flex items-center mt-1 mb-2">
                  <div className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {lawyer.specialization}
                  </div>
                  <div className="ml-2 text-sm text-gray-600">
                    {lawyer.experience} Experience
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-2">{lawyer.description}</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <div className="flex items-center text-gray-500">
                    <FaMoneyBillWave className="mr-1" />
                    ₹{lawyer.fees} per consultation
                  </div>
                  <div className="flex items-center text-gray-500">
                    <FaUser className="mr-1" />
                    {lawyer.languages.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Select Date & Time</h3>
            
            {/* Calendar Date Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Dates</label>
              <div className="flex flex-wrap gap-2">
                {availableDates.map((dateObj) => (
                  <button
                    key={dateObj.date}
                    onClick={() => handleDateSelect(dateObj.date)}
                    className={`flex flex-col items-center p-4 rounded-lg border ${
                      selectedDate === dateObj.date
                        ? 'bg-indigo-100 border-indigo-600'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs font-medium text-gray-500">{dateObj.day}</span>
                    <span className="text-lg font-semibold mt-1">{dateObj.dayOfMonth}</span>
                    <span className="text-xs text-gray-500">{dateObj.month}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Time Slot Selection */}
            {selectedDate && (
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Time Slots for {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </label>
                
                {timeSlots.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`py-2 px-4 rounded-lg border ${
                          selectedTimeSlot === slot
                            ? 'bg-indigo-100 border-indigo-600 text-indigo-800'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-500">No available slots on this date.</p>
                )}
              </div>
            )}
            
            {/* Consultation Type */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Type</label>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setConsultationType('video')}
                  className={`py-3 px-6 rounded-lg border flex items-center ${
                    consultationType === 'video'
                      ? 'bg-indigo-100 border-indigo-600 text-indigo-800'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Video Call
                </button>
                
                <button
                  onClick={() => setConsultationType('phone')}
                  className={`py-3 px-6 rounded-lg border flex items-center ${
                    consultationType === 'phone'
                      ? 'bg-indigo-100 border-indigo-600 text-indigo-800'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Phone Call
                </button>
                
                <button
                  onClick={() => setConsultationType('in-person')}
                  className={`py-3 px-6 rounded-lg border flex items-center ${
                    consultationType === 'in-person'
                      ? 'bg-indigo-100 border-indigo-600 text-indigo-800'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  In-Person
                </button>
              </div>
            </div>
            
            {/* Legal Issue Description */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Briefly describe your legal issue
              </label>
              <textarea
                rows={4}
                value={legalIssue}
                onChange={(e) => setLegalIssue(e.target.value)}
                placeholder="Please provide a brief description of your legal matter to help the lawyer prepare for your consultation."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* Booking Summary */}
            {selectedDate && selectedTimeSlot && (
              <div className="mb-8 bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Booking Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <FaCalendarAlt className="text-indigo-600 mr-2" />
                    <span className="text-gray-700">
                      {new Date(selectedDate).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="text-indigo-600 mr-2" />
                    <span className="text-gray-700">{selectedTimeSlot}</span>
                  </div>
                  <div className="flex items-center">
                    <FaUser className="text-indigo-600 mr-2" />
                    <span className="text-gray-700">{lawyer?.name}</span>
                  </div>
                  <div className="flex items-center">
                    <FaGavel className="text-indigo-600 mr-2" />
                    <span className="text-gray-700">{lawyer?.specialization}</span>
                  </div>
                  <div className="flex items-center">
                    <FaMoneyBillWave className="text-indigo-600 mr-2" />
                    <span className="text-gray-700">₹{lawyer?.fees}</span>
                  </div>
                  <div className="flex items-center">
                    <FaComment className="text-indigo-600 mr-2" />
                    <span className="text-gray-700">{consultationType} consultation</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={handleConfirmBooking}
                disabled={!selectedDate || !selectedTimeSlot || !legalIssue}
                className={`px-6 py-3 rounded-lg transition duration-200 ${
                  selectedDate && selectedTimeSlot && legalIssue
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
        
        {/* Legal Tips */}
        <div className="mt-8 bg-indigo-50 rounded-xl p-6 border border-indigo-100">
          <h3 className="text-lg font-semibold text-indigo-800 mb-4">Prepare for Your Legal Consultation</h3>
          <ul className="space-y-3 text-indigo-700">
            <li className="flex items-start">
              <FaCheck className="text-indigo-600 mt-1 mr-2" />
              <span>Gather all relevant documents and information related to your case.</span>
            </li>
            <li className="flex items-start">
              <FaCheck className="text-indigo-600 mt-1 mr-2" />
              <span>Prepare a chronological summary of events if applicable.</span>
            </li>
            <li className="flex items-start">
              <FaCheck className="text-indigo-600 mt-1 mr-2" />
              <span>Make a list of specific questions you want to ask during the consultation.</span>
            </li>
            <li className="flex items-start">
              <FaCheck className="text-indigo-600 mt-1 mr-2" />
              <span>Be ready 5 minutes before your scheduled time for a smooth consultation experience.</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
} 