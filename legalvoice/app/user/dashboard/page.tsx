'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaUser, 
  FaCreditCard, 
  FaFileAlt, 
  FaCommentAlt, 
  FaHistory, 
  FaGavel, 
  FaCalendarAlt, 
  FaBell,
  FaArrowRight,
  FaFileInvoice,
  FaUserPlus,
  FaLock,
  FaChartLine
} from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';

// Define interface for activity item
interface ActivityItem {
  id: string;
  type: 'document' | 'chat' | 'payment' | 'appointment';
  title: string;
  date: string;
  status?: string;
  description?: string;
  link?: string;
}

// Mock data for recent activity
const recentActivity: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'document',
    title: 'Lease Agreement Draft',
    date: '2023-05-02',
    status: 'completed',
    description: 'Your lease agreement draft has been completed',
    link: '/documents/123'
  },
  {
    id: 'act-2',
    type: 'chat',
    title: 'Chat with AI Assistant',
    date: '2023-05-01',
    description: 'Discussion about tenant rights in California',
    link: '/chat/history/456'
  },
  {
    id: 'act-3',
    type: 'payment',
    title: 'Monthly Subscription',
    date: '2023-04-28',
    status: 'successful',
    description: 'Paid $49.99 for Monthly Pro Plan',
    link: '/billing/history'
  },
  {
    id: 'act-4',
    type: 'appointment',
    title: 'Consultation with Sarah Johnson',
    date: '2023-05-15',
    status: 'upcoming',
    description: 'Corporate Law consultation at 10:00 AM',
    link: '/user/appointments'
  }
];

// Define plan features
interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  name: string;
  features: PlanFeature[];
}

// Mock data for usage metrics
interface UsageMetric {
  name: string;
  used: number;
  total: number;
  unit: string;
}

const usageMetrics: UsageMetric[] = [
  {
    name: 'AI Chat Messages',
    used: 157,
    total: 500,
    unit: 'messages'
  },
  {
    name: 'Document Drafts',
    used: 3,
    total: 10,
    unit: 'documents'
  },
  {
    name: 'Document Analysis',
    used: 2,
    total: 5,
    unit: 'documents'
  }
];

export default function UserDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<number>(2);

  // Simulate loading data
  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login?redirect=/user/dashboard');
      return;
    }

    if (user) {
      // Simulate loading plan data
      setTimeout(() => {
        setCurrentPlan({
          name: 'Pro',
          features: [
            { name: 'Unlimited AI Chat', included: true },
            { name: '10 Document Drafts per month', included: true },
            { name: '5 Document Analysis per month', included: true },
            { name: 'Priority Support', included: true },
            { name: 'Custom Templates', included: false },
          ]
        });
        setIsLoading(false);
      }, 1000);
    }
  }, [user, authLoading, router]);

  // Calculate progress percentage for usage metrics
  const calculateProgress = (used: number, total: number) => {
    return Math.min(Math.round((used / total) * 100), 100);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FaFileAlt className="text-indigo-600" />;
      case 'chat':
        return <FaCommentAlt className="text-green-600" />;
      case 'payment':
        return <FaCreditCard className="text-purple-600" />;
      case 'appointment':
        return <FaCalendarAlt className="text-red-600" />;
      default:
        return <FaFileAlt className="text-indigo-600" />;
    }
  };

  // Get status badge for activity
  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Completed</span>;
      case 'successful':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Successful</span>;
      case 'upcoming':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Upcoming</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Failed</span>;
      default:
        return null;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login in useEffect
  }

  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between mb-8 items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.name || 'User'}!</p>
          </div>

          <div className="mt-4 md:mt-0 flex space-x-2">
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              onClick={() => router.push('/chat')}
            >
              <FaCommentAlt className="mr-2" />
              Start New Chat
            </button>
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              onClick={() => router.push('/documents/create')}
            >
              <FaFileAlt className="mr-2" />
              Create Document
            </button>
            <div className="relative">
              <button
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => router.push('/user/notifications')}
              >
                <FaBell />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-600 rounded-full">
                    {notifications}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link 
            href="/chat" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center text-center"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
              <FaCommentAlt className="text-indigo-600 text-xl" />
            </div>
            <h3 className="font-medium text-gray-900">Ask Legal Questions</h3>
            <p className="text-sm text-gray-500 mt-1">Chat with our AI assistant</p>
          </Link>
          
          <Link 
            href="/documents/create" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center text-center"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <FaFileAlt className="text-green-600 text-xl" />
            </div>
            <h3 className="font-medium text-gray-900">Draft Documents</h3>
            <p className="text-sm text-gray-500 mt-1">Create legal documents with AI</p>
          </Link>
          
          <Link 
            href="/lawyers" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center text-center"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <FaGavel className="text-purple-600 text-xl" />
            </div>
            <h3 className="font-medium text-gray-900">Find a Lawyer</h3>
            <p className="text-sm text-gray-500 mt-1">Connect with legal professionals</p>
          </Link>
          
          <Link 
            href="/user/appointments" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center text-center"
          >
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <FaCalendarAlt className="text-red-600 text-xl" />
            </div>
            <h3 className="font-medium text-gray-900">My Appointments</h3>
            <p className="text-sm text-gray-500 mt-1">View and manage consultations</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Usage Metrics */}
          <div className="col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Usage Metrics</h2>
              <span className="text-sm text-gray-500">Current Billing Cycle</span>
            </div>
            
            <div className="space-y-6">
              {usageMetrics.map((metric) => (
                <div key={metric.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{metric.name}</span>
                    <span className="text-sm text-gray-600">
                      {metric.used} / {metric.total} {metric.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        calculateProgress(metric.used, metric.total) > 80 
                          ? 'bg-red-600' 
                          : calculateProgress(metric.used, metric.total) > 60 
                            ? 'bg-yellow-500' 
                            : 'bg-green-600'
                      }`}
                      style={{ width: `${calculateProgress(metric.used, metric.total)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Current Plan: {currentPlan?.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentPlan?.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <div className={`h-4 w-4 rounded-full ${feature.included ? 'bg-green-100' : 'bg-gray-100'} flex items-center justify-center`}>
                      {feature.included ? (
                        <div className="h-2 w-2 rounded-full bg-green-600"></div>
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                      )}
                    </div>
                    <span className={`ml-2 text-sm ${feature.included ? 'text-gray-900' : 'text-gray-500'}`}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href="/billing"
                  className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  View plan details
                  <FaArrowRight className="ml-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              <Link
                href="/user/activity"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                View all
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <Link 
                  href={activity.link || '#'} 
                  key={activity.id}
                  className="block p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                >
                  <div className="flex">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{activity.title}</h3>
                        {getStatusBadge(activity.status)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(activity.date)}</p>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1 truncate">{activity.description}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Services */}
        <h2 className="text-xl font-medium text-gray-900 mb-4">Additional Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-indigo-500">
            <h3 className="font-medium text-gray-900 mb-2">Document Analysis</h3>
            <p className="text-sm text-gray-600 mb-4">Upload and analyze legal documents with our AI tools</p>
            <Link
              href="/documents/analyze"
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Upload a document
              <FaArrowRight className="ml-1" />
            </Link>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-green-500">
            <h3 className="font-medium text-gray-900 mb-2">Legal Research</h3>
            <p className="text-sm text-gray-600 mb-4">Access our database of legal resources and research tools</p>
            <Link
              href="/research"
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Explore resources
              <FaArrowRight className="ml-1" />
            </Link>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-purple-500">
            <h3 className="font-medium text-gray-900 mb-2">Legal Education</h3>
            <p className="text-sm text-gray-600 mb-4">Learn about legal topics with our educational content</p>
            <Link
              href="/learn"
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Browse topics
              <FaArrowRight className="ml-1" />
            </Link>
          </div>
        </div>

        {/* Account Management Shortcuts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Account Management</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/user/profile"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150"
            >
              <FaUser className="text-gray-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Profile</span>
            </Link>
            
            <Link
              href="/billing"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150"
            >
              <FaCreditCard className="text-gray-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Billing</span>
            </Link>
            
            <Link
              href="/billing/invoices"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150"
            >
              <FaFileInvoice className="text-gray-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Invoices</span>
            </Link>
            
            <Link
              href="/user/security"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150"
            >
              <FaLock className="text-gray-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Security</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 