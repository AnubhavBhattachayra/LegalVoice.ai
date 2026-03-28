'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaBell, 
  FaEnvelope, 
  FaMobile, 
  FaCalendarAlt, 
  FaSpinner, 
  FaArrowLeft,
  FaCheck,
  FaClock,
  FaExclamationCircle,
  FaFileAlt,
  FaUserCircle,
  FaWallet
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

// Notification preference interface
interface NotificationPreference {
  id: string;
  type: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

// Notification interface
interface Notification {
  id: string;
  type: 'appointment' | 'document' | 'payment' | 'message' | 'system' | 'profile';
  title: string;
  message: string;
  isRead: boolean;
  timestamp: number;
  actionUrl?: string;
  actionLabel?: string;
}

const NotificationsPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [updatingPreference, setUpdatingPreference] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  
  // Mock notification preferences
  const mockPreferences: NotificationPreference[] = [
    {
      id: 'pref_1',
      type: 'Appointment reminders',
      email: true,
      push: true,
      sms: false
    },
    {
      id: 'pref_2',
      type: 'Document updates',
      email: true,
      push: false,
      sms: false
    },
    {
      id: 'pref_3',
      type: 'Billing & payments',
      email: true,
      push: true,
      sms: true
    },
    {
      id: 'pref_4',
      type: 'Chat messages',
      email: false,
      push: true,
      sms: false
    },
    {
      id: 'pref_5',
      type: 'System announcements',
      email: true,
      push: false,
      sms: false
    }
  ];
  
  // Mock notifications
  const mockNotifications: Notification[] = [
    {
      id: 'notif_1',
      type: 'appointment',
      title: 'Upcoming Appointment',
      message: 'You have a consultation with Jane Smith (Family Law) tomorrow at 10:00 AM.',
      isRead: false,
      timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      actionUrl: '/user/appointments',
      actionLabel: 'View appointment'
    },
    {
      id: 'notif_2',
      type: 'document',
      title: 'Document Shared',
      message: 'John Doe shared a document "Divorce Agreement - Draft" with you.',
      isRead: false,
      timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
      actionUrl: '/documents/123456',
      actionLabel: 'View document'
    },
    {
      id: 'notif_3',
      type: 'payment',
      title: 'Payment Successful',
      message: 'Your monthly subscription payment of $29.99 was successfully processed.',
      isRead: true,
      timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      actionUrl: '/billing/invoices',
      actionLabel: 'View receipt'
    },
    {
      id: 'notif_4',
      type: 'message',
      title: 'New Message',
      message: 'You have a new message from your attorney, Michael Johnson.',
      isRead: true,
      timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
      actionUrl: '/chat',
      actionLabel: 'View message'
    },
    {
      id: 'notif_5',
      type: 'system',
      title: 'System Maintenance',
      message: 'LegalVoice will be undergoing maintenance on Saturday from 2 AM to 4 AM ET.',
      isRead: true,
      timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    },
    {
      id: 'notif_6',
      type: 'profile',
      title: 'Profile Update Required',
      message: 'Please update your profile information to ensure you receive important legal updates.',
      isRead: false,
      timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000, // 6 days ago
      actionUrl: '/user/profile',
      actionLabel: 'Update profile'
    }
  ];
  
  // Load user data
  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login?redirect=/user/notifications');
      return;
    }
    
    if (user) {
      // In a real app, these would be API calls
      setTimeout(() => {
        setPreferences(mockPreferences);
        setNotifications(mockNotifications);
        setIsLoading(false);
      }, 1000);
    }
  }, [user, authLoading, router]);
  
  // Get filtered notifications
  const getFilteredNotifications = () => {
    if (activeTab === 'unread') {
      return notifications.filter(notif => !notif.isRead);
    }
    return notifications;
  };
  
  // Get notification count
  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.isRead).length;
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Less than a minute
    if (diff < 60 * 1000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    // Otherwise use date
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Toggle notification preference
  const togglePreference = (id: string, channel: 'email' | 'push' | 'sms') => {
    setUpdatingPreference(id);
    
    // Simulate API call
    setTimeout(() => {
      setPreferences(prev => 
        prev.map(pref => {
          if (pref.id === id) {
            return {
              ...pref,
              [channel]: !pref[channel]
            };
          }
          return pref;
        })
      );
      setUpdatingPreference(null);
    }, 500);
  };
  
  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => {
        if (notif.id === id) {
          return {
            ...notif,
            isRead: true
          };
        }
        return notif;
      })
    );
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setMarkingAllRead(true);
    
    // Simulate API call
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(notif => ({
          ...notif,
          isRead: true
        }))
      );
      setMarkingAllRead(false);
    }, 1000);
  };
  
  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <FaCalendarAlt className="text-blue-500" />;
      case 'document':
        return <FaFileAlt className="text-green-500" />;
      case 'payment':
        return <FaWallet className="text-purple-500" />;
      case 'message':
        return <FaEnvelope className="text-indigo-500" />;
      case 'system':
        return <FaExclamationCircle className="text-yellow-500" />;
      case 'profile':
        return <FaUserCircle className="text-gray-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };
  
  // Loading state
  if (authLoading || (isLoading && user)) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
      </div>
    );
  }
  
  // No user, redirect handled in useEffect
  if (!user && !authLoading) {
    return null;
  }
  
  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <Link 
            href="/user/dashboard" 
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <FaArrowLeft className="mr-2" />
            Back to Dashboard
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Notifications</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notification preferences */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Notification Preferences</h2>
              
              <div className="space-y-6">
                {preferences.map(preference => (
                  <div key={preference.id} className="pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                    <div className="font-medium text-gray-900 mb-3">{preference.type}</div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex items-center">
                        <button
                          onClick={() => togglePreference(preference.id, 'email')}
                          disabled={updatingPreference === preference.id}
                          className={`flex items-center justify-center h-6 w-6 rounded-md ${
                            preference.email 
                              ? 'bg-indigo-600 hover:bg-indigo-700' 
                              : 'bg-gray-200 hover:bg-gray-300'
                          } text-white transition-colors`}
                        >
                          {updatingPreference === preference.id ? (
                            <FaSpinner className="animate-spin h-3 w-3" />
                          ) : preference.email ? (
                            <FaCheck className="h-3 w-3" />
                          ) : null}
                        </button>
                        <span className="ml-2 text-sm text-gray-600">Email</span>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => togglePreference(preference.id, 'push')}
                          disabled={updatingPreference === preference.id}
                          className={`flex items-center justify-center h-6 w-6 rounded-md ${
                            preference.push 
                              ? 'bg-indigo-600 hover:bg-indigo-700' 
                              : 'bg-gray-200 hover:bg-gray-300'
                          } text-white transition-colors`}
                        >
                          {updatingPreference === preference.id ? (
                            <FaSpinner className="animate-spin h-3 w-3" />
                          ) : preference.push ? (
                            <FaCheck className="h-3 w-3" />
                          ) : null}
                        </button>
                        <span className="ml-2 text-sm text-gray-600">Push</span>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => togglePreference(preference.id, 'sms')}
                          disabled={updatingPreference === preference.id}
                          className={`flex items-center justify-center h-6 w-6 rounded-md ${
                            preference.sms 
                              ? 'bg-indigo-600 hover:bg-indigo-700' 
                              : 'bg-gray-200 hover:bg-gray-300'
                          } text-white transition-colors`}
                        >
                          {updatingPreference === preference.id ? (
                            <FaSpinner className="animate-spin h-3 w-3" />
                          ) : preference.sms ? (
                            <FaCheck className="h-3 w-3" />
                          ) : null}
                        </button>
                        <span className="ml-2 text-sm text-gray-600">SMS</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Notifications list */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      activeTab === 'all' 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('unread')}
                    className={`px-3 py-1 rounded-md text-sm font-medium flex items-center ${
                      activeTab === 'unread' 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Unread
                    {getUnreadCount() > 0 && (
                      <span className="ml-2 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-xs">
                        {getUnreadCount()}
                      </span>
                    )}
                  </button>
                </div>
                
                <button
                  onClick={markAllAsRead}
                  disabled={markingAllRead || getUnreadCount() === 0}
                  className={`text-sm font-medium ${
                    getUnreadCount() === 0 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-indigo-600 hover:text-indigo-800'
                  }`}
                >
                  {markingAllRead ? (
                    <span className="flex items-center">
                      <FaSpinner className="animate-spin mr-2 h-3 w-3" />
                      Marking all as read...
                    </span>
                  ) : 'Mark all as read'}
                </button>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {getFilteredNotifications().length === 0 ? (
                  <div className="py-12 text-center">
                    <FaBell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
                    <p className="text-gray-500">
                      {activeTab === 'unread' 
                        ? "You're all caught up! No unread notifications."
                        : "You don't have any notifications yet."}
                    </p>
                  </div>
                ) : (
                  getFilteredNotifications().map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-6 ${notification.isRead ? 'bg-white' : 'bg-indigo-50'}`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 whitespace-nowrap ml-4 flex items-center">
                              <FaClock className="mr-1 h-3 w-3" />
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            {notification.message}
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            {notification.actionUrl ? (
                              <Link
                                href={notification.actionUrl}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                onClick={() => markAsRead(notification.id)}
                              >
                                {notification.actionLabel}
                              </Link>
                            ) : (
                              <span></span>
                            )}
                            
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotificationsPage; 