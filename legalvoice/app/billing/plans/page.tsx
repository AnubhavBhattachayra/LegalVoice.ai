'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheck, FaArrowRight, FaCrown, FaStar, FaRocket } from 'react-icons/fa';
import { useAuth } from '@/app/lib/context/AuthContext';
import { usePayment } from '@/app/lib/context/PaymentContext';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import BillingNavigation from '@/app/components/BillingNavigation';

export default function SubscriptionPlans() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { 
    subscriptionPlans, 
    isLoadingPlans, 
    subscription, 
    isLoadingSubscription, 
    updateSubscription 
  } = usePayment();
  
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Function to get the icon for each plan
  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return <FaStar className="text-blue-500 text-2xl" />;
      case 'professional':
        return <FaCrown className="text-indigo-600 text-2xl" />;
      case 'enterprise':
        return <FaRocket className="text-purple-600 text-2xl" />;
      default:
        return <FaStar className="text-blue-500 text-2xl" />;
    }
  };

  // Function to handle plan selection
  const handleSelectPlan = async (planId: string) => {
    if (isProcessing) return;
    
    // Don't allow selecting the current plan
    if (subscription && subscription.planId === planId) {
      toast.error('You are already subscribed to this plan');
      return;
    }
    
    setSelectedPlanId(planId);
    setIsProcessing(true);
    
    try {
      const success = await updateSubscription(planId);
      
      if (success) {
        toast.success('Subscription updated successfully');
        router.push('/profile?tab=subscription');
      }
    } catch (error) {
      console.error('Subscription update error:', error);
      toast.error('Failed to update subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if this is the current plan
  const isCurrentPlan = (planId: string) => {
    return subscription?.planId === planId;
  };

  if (authLoading || isLoadingPlans || isLoadingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading subscription plans..." />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800">Choose Your Plan</h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Select the plan that best fits your legal document needs, from basic to comprehensive coverage
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <BillingNavigation />
            </div>
            
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {subscriptionPlans.map((plan) => (
                  <div 
                    key={plan._id}
                    className={`bg-white rounded-xl shadow-md overflow-hidden border-2 transition-all duration-300 ${
                      isCurrentPlan(plan._id)
                        ? 'border-indigo-500 transform scale-105'
                        : 'border-transparent hover:border-indigo-300'
                    }`}
                  >
                    <div className={`p-6 ${
                      plan.name.toLowerCase() === 'professional' 
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' 
                        : plan.name.toLowerCase() === 'enterprise'
                          ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white'
                          : 'bg-gradient-to-br from-blue-500 to-teal-400 text-white'
                    }`}>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h2 className="text-2xl font-bold">{plan.name}</h2>
                          <p className="text-sm opacity-90">{plan.description}</p>
                        </div>
                        {getPlanIcon(plan.name)}
                      </div>
                      
                      <div className="mt-4">
                        <span className="text-3xl font-bold">${plan.price}</span>
                        <span className="text-sm opacity-90">/{plan.interval}</span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <ul className="space-y-3 mb-8">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <button
                        onClick={() => handleSelectPlan(plan._id)}
                        disabled={isProcessing || isCurrentPlan(plan._id)}
                        className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center ${
                          isCurrentPlan(plan._id)
                            ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                            : plan.name.toLowerCase() === 'professional'
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : plan.name.toLowerCase() === 'enterprise'
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {isProcessing && selectedPlanId === plan._id ? (
                          <LoadingSpinner size="small" className="mr-2" />
                        ) : null}
                        
                        {isCurrentPlan(plan._id)
                          ? 'Current Plan'
                          : 'Select Plan'}
                        
                        {!isProcessing && !isCurrentPlan(plan._id) && (
                          <FaArrowRight className="ml-2" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">Have questions about our plans?</p>
          <a 
            href="/contact" 
            className="text-indigo-600 font-medium hover:text-indigo-800 transition"
          >
            Contact our support team for more information
          </a>
        </div>
      </div>
    </main>
  );
} 