'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaFileInvoiceDollar, 
  FaCreditCard, 
  FaChartLine, 
  FaCrown, 
  FaArrowRight, 
  FaHistory 
} from 'react-icons/fa';
import { useAuth } from '@/app/lib/context/AuthContext';
import { usePayment } from '@/app/lib/context/PaymentContext';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import BillingNavigation from '@/app/components/BillingNavigation';

interface BillingCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkText: string;
  linkUrl: string;
}

const BillingCard: React.FC<BillingCardProps> = ({ 
  title, 
  description, 
  icon, 
  linkText, 
  linkUrl 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-lg hover:border-indigo-100">
      <div className="p-6">
        <div className="flex items-start">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 mr-4">
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6">{description}</p>
            <Link
              href={linkUrl}
              className="text-indigo-600 font-medium flex items-center hover:text-indigo-800 transition"
            >
              {linkText} <FaArrowRight className="ml-2 text-sm" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function BillingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { subscription, isLoadingSubscription } = usePayment();
  
  const [usageStats, setUsageStats] = useState({
    documentsAnalyzed: 0,
    documentsLimit: 0,
    chatMessagesUsed: 0,
    chatMessagesLimit: 0,
    daysRemaining: 0
  });

  useEffect(() => {
    if (user && subscription) {
      // Mock data - in a real app, this would be fetched from the API
      setUsageStats({
        documentsAnalyzed: 12,
        documentsLimit: subscription.planName === 'Basic' ? 20 : 
                      subscription.planName === 'Professional' ? 100 : 500,
        chatMessagesUsed: 45,
        chatMessagesLimit: subscription.planName === 'Basic' ? 100 : 
                      subscription.planName === 'Professional' ? 500 : 'Unlimited',
        daysRemaining: 18
      });
    }
  }, [user, subscription]);

  if (authLoading || isLoadingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading billing information..." />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const renderUsageStat = (used: number, limit: any, label: string) => {
    const percentage = typeof limit === 'number' ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    const displayLimit = typeof limit === 'number' ? limit : limit;
    
    return (
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-600">
            {used} / {displayLimit}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              percentage < 70 ? 'bg-green-500' : 
              percentage < 90 ? 'bg-yellow-500' : 
              'bg-red-500'
            }`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Billing & Subscription</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <BillingNavigation />
            </div>
            
            <div className="lg:col-span-3">
              {subscription ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-10">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-wrap items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                          {subscription.planName} Plan
                        </h2>
                        <p className="text-gray-600 mt-1">
                          Your subscription renews on {new Date(subscription.nextBillingDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-4 sm:mt-0">
                        <span className="text-2xl font-bold text-gray-900">${subscription.price}</span>
                        <span className="text-gray-600">/{subscription.interval}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Usage Statistics</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        {renderUsageStat(
                          usageStats.documentsAnalyzed, 
                          usageStats.documentsLimit, 
                          'Document Analysis'
                        )}
                        
                        {renderUsageStat(
                          usageStats.chatMessagesUsed, 
                          usageStats.chatMessagesLimit, 
                          'Chat Messages'
                        )}
                      </div>
                      
                      <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-indigo-700 font-medium">Current Billing Period</p>
                          <p className="text-indigo-800 font-bold mt-1">
                            {usageStats.daysRemaining} days remaining
                          </p>
                        </div>
                        <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border-4 border-indigo-200">
                          <FaChartLine size={24} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-10">
                  <div className="flex items-start">
                    <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600 mr-4">
                      <FaCrown size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Active Subscription</h2>
                      <p className="text-yellow-700 mb-4">
                        You don't have an active subscription. Choose a plan to access all features and get the most out of LegalVoice AI.
                      </p>
                      <Link
                        href="/billing/plans"
                        className="inline-block bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition"
                      >
                        View Plans
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <BillingCard
                  title="Subscription Plans"
                  description="View and change your subscription plan to meet your legal document needs"
                  icon={<FaCrown size={24} />}
                  linkText="Manage Plans"
                  linkUrl="/billing/plans"
                />
                
                <BillingCard
                  title="Billing History"
                  description="View your past invoices, payment history, and download receipts"
                  icon={<FaHistory size={24} />}
                  linkText="View History"
                  linkUrl="/billing/history"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BillingCard
                  title="Payment Methods"
                  description="Add, edit, or remove payment methods for your account"
                  icon={<FaCreditCard size={24} />}
                  linkText="Manage Payments"
                  linkUrl="/payments/settings"
                />
                
                <BillingCard
                  title="Invoices & Receipts"
                  description="Download or view detailed invoices for your subscription payments"
                  icon={<FaFileInvoiceDollar size={24} />}
                  linkText="View Invoices"
                  linkUrl="/billing/history"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 