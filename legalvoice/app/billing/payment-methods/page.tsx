'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaCreditCard, 
  FaPlus, 
  FaSpinner, 
  FaArrowLeft, 
  FaTrash, 
  FaCheck, 
  FaPencilAlt,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

// Payment method interface
interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  isDefault: boolean;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  brand?: string;
  bankName?: string;
}

const PaymentMethodsPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isSettingDefaultId, setIsSettingDefaultId] = useState<string | null>(null);
  
  // Mock payment methods data
  const mockPaymentMethods: PaymentMethod[] = [
    {
      id: 'pm_123456',
      type: 'card',
      isDefault: true,
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2025,
      brand: 'visa'
    },
    {
      id: 'pm_789012',
      type: 'card',
      isDefault: false,
      last4: '9999',
      expiryMonth: 4,
      expiryYear: 2024,
      brand: 'mastercard'
    },
    {
      id: 'ba_345678',
      type: 'bank_account',
      isDefault: false,
      last4: '6789',
      bankName: 'Chase'
    }
  ];
  
  // Load user data
  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login?redirect=/billing/payment-methods');
      return;
    }
    
    if (user) {
      // In a real app, this would be an API call
      setTimeout(() => {
        setPaymentMethods(mockPaymentMethods);
        setIsLoading(false);
      }, 1000);
    }
  }, [user, authLoading, router]);
  
  // Handle delete payment method
  const handleDelete = (id: string) => {
    setIsDeletingId(id);
    
    // Simulate API call to delete
    setTimeout(() => {
      setPaymentMethods(prev => prev.filter(method => method.id !== id));
      setIsDeletingId(null);
    }, 1500);
  };
  
  // Handle set default payment method
  const handleSetDefault = (id: string) => {
    if (id === paymentMethods.find(pm => pm.isDefault)?.id) return;
    
    setIsSettingDefaultId(id);
    
    // Simulate API call to update default
    setTimeout(() => {
      setPaymentMethods(prev => 
        prev.map(method => ({
          ...method,
          isDefault: method.id === id
        }))
      );
      setIsSettingDefaultId(null);
    }, 1500);
  };
  
  // Get card icon based on brand
  const getCardIcon = (brand?: string) => {
    // In a real app, you would use specific icons for each brand
    return <FaCreditCard className="text-gray-600" />;
  };
  
  // Format expiry date
  const formatExpiry = (month?: number, year?: number) => {
    if (!month || !year) return 'N/A';
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
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
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link 
            href="/billing" 
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <FaArrowLeft className="mr-2" />
            Back to Billing
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Payment Methods</h1>
        
        {/* Payment methods list */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Your payment methods</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaPlus className="-ml-1 mr-2 h-4 w-4" />
              Add new
            </button>
          </div>
          
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <FaExclamationTriangle className="mx-auto h-12 w-12 text-yellow-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No payment methods</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't added any payment methods yet.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FaPlus className="-ml-1 mr-2 h-4 w-4" />
                  Add payment method
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {paymentMethods.map((method) => (
                <li key={method.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-4">
                        {method.type === 'card' ? getCardIcon(method.brand) : <FaCreditCard className="text-gray-600" />}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {method.type === 'card' 
                            ? `${method.brand?.charAt(0).toUpperCase()}${method.brand?.slice(1) || ''} •••• ${method.last4}`
                            : `Bank account •••• ${method.last4}`
                          }
                          {method.isDefault && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {method.type === 'card' 
                            ? `Expires ${formatExpiry(method.expiryMonth, method.expiryYear)}`
                            : method.bankName
                          }
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      {!method.isDefault && (
                        <button
                          onClick={() => handleSetDefault(method.id)}
                          disabled={isSettingDefaultId === method.id}
                          className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                          title="Set as default"
                        >
                          {isSettingDefaultId === method.id ? (
                            <FaSpinner className="animate-spin h-5 w-5" />
                          ) : (
                            <FaCheck className="h-5 w-5" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(method.id)}
                        disabled={isDeletingId === method.id || method.isDefault}
                        className={`${method.isDefault 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-red-600 hover:text-red-800 disabled:opacity-50'}`}
                        title={method.isDefault ? "Cannot delete default payment method" : "Delete"}
                      >
                        {isDeletingId === method.id ? (
                          <FaSpinner className="animate-spin h-5 w-5" />
                        ) : (
                          <FaTrash className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-800"
                        title="Edit"
                      >
                        <FaPencilAlt className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Add payment method form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Add payment method</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 mb-1">
                  Card number
                </label>
                <input
                  type="text"
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry date
                  </label>
                  <input
                    type="text"
                    id="expiry"
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-1">
                    CVC
                  </label>
                  <input
                    type="text"
                    id="cvc"
                    placeholder="123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name on card
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="default"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="default" className="ml-2 block text-sm text-gray-700">
                  Set as default payment method
                </label>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add payment method
                </button>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Your payment information is processed securely. We do not store your credit card details.
              </p>
            </div>
          </div>
        )}
        
        {/* Security notice */}
        <div className="bg-indigo-50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Payment security</h2>
          <p className="text-gray-700 mb-4">
            We use industry-standard encryption and security measures to protect your payment information.
            Your card details are never stored on our servers and are processed through our secure payment provider.
          </p>
          <Link
            href="/help/payment-security"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Learn more about our security practices
          </Link>
        </div>
      </div>
    </main>
  );
};

export default PaymentMethodsPage; 