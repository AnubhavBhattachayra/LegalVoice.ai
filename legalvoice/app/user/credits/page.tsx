'use client';

import React, { useEffect, useState } from 'react';
import { FaCrown, FaHistory, FaArrowUp, FaCheck, FaSpinner, FaCreditCard } from 'react-icons/fa';
import axios from 'axios';

interface SubscriptionTier {
  id: string;
  name: string;
  monthly_price: number;
  document_credits: number;
  features: {
    ai_drafting_allowed: boolean;
    complex_documents: boolean;
    form_uploads: boolean;
    premium_support: boolean;
  };
}

interface UserCredit {
  user_id: string;
  subscription_tier: string;
  total_credits: number;
  used_credits: number;
  next_renewal_date: string;
  credit_history: CreditTransaction[];
}

interface CreditTransaction {
  amount: number;
  transaction_type: string;
  description: string;
  timestamp: string;
}

export default function CreditsPage() {
  const [userCredits, setUserCredits] = useState<UserCredit | null>(null);
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch user credits
        const creditsResponse = await axios.get('/api/credits/my');
        setUserCredits(creditsResponse.data);
        
        // Fetch subscription tiers
        const tiersResponse = await axios.get('/api/credits/subscription-tiers');
        setSubscriptionTiers(tiersResponse.data);
        
        setIsLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load user credits information');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleUpgrade = async (tierId: string) => {
    try {
      setIsUpgrading(true);
      setError(null);
      
      await axios.post('/api/credits/upgrade', { tier_id: tierId });
      
      // Refetch user credits
      const response = await axios.get('/api/credits/my');
      setUserCredits(response.data);
      
      setIsUpgrading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upgrade subscription');
      setIsUpgrading(false);
    }
  };

  const toggleTransactionHistory = () => {
    setShowTransactions(!showTransactions);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
        <span className="ml-2 text-gray-600">Loading credits information...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Your Credits & Subscription</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Credit overview */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Available Credits</h2>
            <div className="flex items-center">
              <div className="text-4xl font-bold text-blue-600">
                {userCredits ? userCredits.total_credits - userCredits.used_credits : 0}
              </div>
              <div className="ml-4">
                <div className="text-sm text-gray-600">
                  Total Credits: {userCredits?.total_credits || 0}
                </div>
                <div className="text-sm text-gray-600">
                  Used: {userCredits?.used_credits || 0}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="flex items-center">
                <FaCrown className="text-yellow-500" />
                <span className="ml-2 font-semibold">
                  {userCredits?.subscription_tier || 'Free'} Plan
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Renews on: {userCredits ? new Date(userCredits.next_renewal_date).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={toggleTransactionHistory}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FaHistory className="mr-1" />
            {showTransactions ? 'Hide' : 'View'} Transaction History
          </button>
          
          {showTransactions && userCredits?.credit_history && (
            <div className="mt-4 border rounded overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userCredits.credit_history.map((transaction, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.transaction_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Subscription tiers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <p className="text-gray-600 mb-6">
          Upgrade your subscription to get more document credits and premium features.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subscriptionTiers.map((tier) => {
            const isCurrentTier = userCredits?.subscription_tier === tier.id;
            
            return (
              <div
                key={tier.id}
                className={`border rounded-lg p-4 ${
                  isCurrentTier ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <h3 className="font-bold text-lg">{tier.name}</h3>
                <div className="text-2xl font-bold my-2">
                  ₹{tier.monthly_price}/mo
                </div>
                <div className="text-gray-600 mb-4">
                  {tier.document_credits} credits per month
                </div>
                
                <ul className="mb-4 space-y-2">
                  <li className="flex items-center">
                    <FaCheck className="text-green-500 mr-2" />
                    <span>{tier.document_credits} Document Credits</span>
                  </li>
                  
                  <li className="flex items-center">
                    {tier.features.ai_drafting_allowed ? (
                      <FaCheck className="text-green-500 mr-2" />
                    ) : (
                      <span className="text-gray-300 mr-2">✕</span>
                    )}
                    <span className={!tier.features.ai_drafting_allowed ? 'text-gray-400' : ''}>
                      AI Document Drafting
                    </span>
                  </li>
                  
                  <li className="flex items-center">
                    {tier.features.complex_documents ? (
                      <FaCheck className="text-green-500 mr-2" />
                    ) : (
                      <span className="text-gray-300 mr-2">✕</span>
                    )}
                    <span className={!tier.features.complex_documents ? 'text-gray-400' : ''}>
                      Complex Documents
                    </span>
                  </li>
                  
                  <li className="flex items-center">
                    {tier.features.form_uploads ? (
                      <FaCheck className="text-green-500 mr-2" />
                    ) : (
                      <span className="text-gray-300 mr-2">✕</span>
                    )}
                    <span className={!tier.features.form_uploads ? 'text-gray-400' : ''}>
                      Form Uploads
                    </span>
                  </li>
                  
                  <li className="flex items-center">
                    {tier.features.premium_support ? (
                      <FaCheck className="text-green-500 mr-2" />
                    ) : (
                      <span className="text-gray-300 mr-2">✕</span>
                    )}
                    <span className={!tier.features.premium_support ? 'text-gray-400' : ''}>
                      Premium Support
                    </span>
                  </li>
                </ul>
                
                {isCurrentTier ? (
                  <button
                    disabled
                    className="w-full py-2 px-4 bg-gray-300 text-gray-600 rounded-lg"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={isUpgrading}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow flex items-center justify-center"
                  >
                    {isUpgrading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaArrowUp className="mr-2" />
                        Upgrade
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Need more credits?</h3>
          <p className="text-gray-600 mb-4">
            If you need more document credits without changing your subscription, you can purchase additional credits.
          </p>
          <button
            className="flex items-center justify-center py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
          >
            <FaCreditCard className="mr-2" />
            Purchase Additional Credits
          </button>
        </div>
      </div>
    </div>
  );
} 