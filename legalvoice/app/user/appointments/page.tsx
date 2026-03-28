'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaCalendarAlt, FaClock, FaUser, FaMapMarkerAlt, FaVideo, FaPhone, FaTimesCircle, FaCheckCircle, FaSpinner, FaChevronLeft, FaFilePdf, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';

interface Appointment {
  id: string;
  lawyerId: string;
  lawyerName: string;
  lawyerImage: string;
  specialty: string;
  date: string;
  time: string;
  duration: number;
  topic: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
  documents?: Array<{
    id: string;
    name: string;
    url: string;
  }>;
}

// Mock data for appointments
const mockAppointments: Appointment[] = [
  {
    id: 'appt-1',
    lawyerId: 'lawyer-1',
    lawyerName: 'Sarah Johnson',
    lawyerImage: 'https://randomuser.me/api/portraits/women/33.jpg',
    specialty: 'Corporate Law',
    date: '2023-05-15',
    time: '10:00',
    duration: 60,
    topic: 'Startup incorporation advice',
    status: 'upcoming',
    meetingLink: 'https://meet.example.com/room/123456',
  },
  {
    id: 'appt-2',
    lawyerId: 'lawyer-2',
    lawyerName: 'Michael Chen',
    lawyerImage: 'https://randomuser.me/api/portraits/men/45.jpg',
    specialty: 'Intellectual Property',
    date: '2023-04-20',
    time: '14:30',
    duration: 60,
    topic: 'Patent application review',
    status: 'completed',
    notes: 'Discussed patent application process. Lawyer suggested several improvements to the application draft.',
    documents: [
      {
        id: 'doc-1',
        name: 'Meeting Summary.pdf',
        url: '/documents/summary.pdf',
      },
      {
        id: 'doc-2',
        name: 'Patent Draft Feedback.pdf',
        url: '/documents/feedback.pdf',
      },
    ],
  },
  {
    id: 'appt-3',
    lawyerId: 'lawyer-3',
    lawyerName: 'Robert Williams',
    lawyerImage: 'https://randomuser.me/api/portraits/men/22.jpg',
    specialty: 'Tax Law',
    date: '2023-03-10',
    time: '11:00',
    duration: 45,
    topic: 'Tax planning for small business',
    status: 'cancelled',
  },
];

export default function UserAppointments() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancellationInProgress, setCancellationInProgress] = useState(false);
  
  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login?redirect=/user/appointments');
      return;
    }
    
    if (user) {
      // Simulate API call to fetch appointments
      setTimeout(() => {
        setAppointments(mockAppointments);
        setIsLoading(false);
      }, 1000);
    }
  }, [user, authLoading, router]);
  
  const upcomingAppointments = appointments.filter(
    (appointment) => appointment.status === 'upcoming'
  );
  
  const pastAppointments = appointments.filter(
    (appointment) => appointment.status === 'completed' || appointment.status === 'cancelled'
  );
  
  const handleCancelAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelConfirm(true);
  };
  
  const confirmCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    setCancellationInProgress(true);
    
    // Simulate API call to cancel appointment
    setTimeout(() => {
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === selectedAppointment.id
            ? { ...appt, status: 'cancelled' }
            : appt
        )
      );
      
      setShowCancelConfirm(false);
      setCancellationInProgress(false);
      setSelectedAppointment(null);
    }, 1500);
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const isAppointmentSoon = (appointment: Appointment) => {
    const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Return true if appointment is in less than 15 minutes
    return minutesDiff > 0 && minutesDiff < 15;
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Upcoming</span>;
      case 'completed':
        return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Cancelled</span>;
      default:
        return null;
    }
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
        <FaSpinner className="animate-spin text-indigo-600 mr-2" />
        <span>Loading appointments...</span>
      </div>
    );
  }
  
  if (!user) {
    return null; // Will redirect to login in useEffect
  }
  
  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/user/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
              <FaChevronLeft className="mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">My Appointments</h1>
          </div>
          <Link
            href="/lawyers"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <FaCalendarAlt className="mr-2" />
            Book New Consultation
          </Link>
        </div>
        
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'upcoming'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upcoming ({upcomingAppointments.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'past'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Past Appointments ({pastAppointments.length})
              </button>
            </nav>
          </div>
          
          {/* Appointment List */}
          <div className="p-6">
            {activeTab === 'upcoming' && (
              <>
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Upcoming Appointments</h3>
                    <p className="text-gray-500 mb-6">
                      You don't have any upcoming appointments scheduled.
                    </p>
                    <Link
                      href="/lawyers"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Book a Consultation
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex">
                            <img
                              src={appointment.lawyerImage}
                              alt={appointment.lawyerName}
                              className="h-12 w-12 rounded-full object-cover mr-4"
                            />
                            <div>
                              <h3 className="font-medium text-lg">{appointment.lawyerName}</h3>
                              <p className="text-gray-600">{appointment.specialty}</p>
                            </div>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center">
                            <FaCalendarAlt className="text-indigo-600 mr-2" />
                            <span>{formatDate(appointment.date)}</span>
                          </div>
                          <div className="flex items-center">
                            <FaClock className="text-indigo-600 mr-2" />
                            <span>{appointment.time} ({appointment.duration} minutes)</span>
                          </div>
                        </div>
                        
                        <div className="mb-4 border-t border-b py-4">
                          <h4 className="font-medium mb-2">Consultation Topic:</h4>
                          <p className="text-gray-700">{appointment.topic}</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                          {isAppointmentSoon(appointment) && appointment.meetingLink && (
                            <a
                              href={appointment.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                            >
                              <FaVideo className="mr-2" />
                              Join Meeting
                            </a>
                          )}
                          <Link
                            href={`/lawyers/${appointment.lawyerId}`}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                          >
                            <FaUser className="mr-2" />
                            View Lawyer Profile
                          </Link>
                          <button
                            onClick={() => handleCancelAppointment(appointment)}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-gray-50"
                          >
                            <FaTimesCircle className="mr-2" />
                            Cancel Appointment
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'past' && (
              <>
                {pastAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Past Appointments</h3>
                    <p className="text-gray-500">
                      You don't have any past appointments.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pastAppointments.map((appointment) => (
                      <div key={appointment.id} className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex">
                            <img
                              src={appointment.lawyerImage}
                              alt={appointment.lawyerName}
                              className="h-12 w-12 rounded-full object-cover mr-4"
                            />
                            <div>
                              <h3 className="font-medium text-lg">{appointment.lawyerName}</h3>
                              <p className="text-gray-600">{appointment.specialty}</p>
                            </div>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center">
                            <FaCalendarAlt className="text-indigo-600 mr-2" />
                            <span>{formatDate(appointment.date)}</span>
                          </div>
                          <div className="flex items-center">
                            <FaClock className="text-indigo-600 mr-2" />
                            <span>{appointment.time} ({appointment.duration} minutes)</span>
                          </div>
                        </div>
                        
                        <div className="mb-4 border-t border-b py-4">
                          <h4 className="font-medium mb-2">Consultation Topic:</h4>
                          <p className="text-gray-700">{appointment.topic}</p>
                          
                          {appointment.notes && (
                            <div className="mt-4">
                              <h4 className="font-medium mb-2">Notes:</h4>
                              <p className="text-gray-700">{appointment.notes}</p>
                            </div>
                          )}
                        </div>
                        
                        {appointment.documents && appointment.documents.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Documents:</h4>
                            <div className="space-y-2">
                              {appointment.documents.map((doc) => (
                                <a
                                  key={doc.id}
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center p-2 bg-white border rounded-md hover:bg-gray-50"
                                >
                                  <FaFilePdf className="text-red-500 mr-2" />
                                  <span>{doc.name}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {appointment.status === 'completed' && (
                          <div className="flex justify-end">
                            <Link
                              href={`/lawyers/${appointment.lawyerId}/review?appointmentId=${appointment.id}`}
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                              <FaStar className="mr-2" />
                              Write a Review
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-[0.75] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center text-red-500 mb-4">
              <FaExclamationTriangle className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
              Cancel Appointment?
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              Are you sure you want to cancel your appointment with {selectedAppointment.lawyerName} on {formatDate(selectedAppointment.date)} at {selectedAppointment.time}?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Keep Appointment
              </button>
              <button
                onClick={confirmCancelAppointment}
                disabled={cancellationInProgress}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center"
              >
                {cancellationInProgress ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="mr-2" />
                    Yes, Cancel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 