'use client';

import React, { useState } from 'react';
import { usePayment } from '@/app/context/PaymentContext';
import { FaCreditCard, FaCheckCircle, FaTrash, FaStar, FaRegStar, FaSpinner } from 'react-icons/fa';

interface PaymentMethodListProps {
  onAddClick?: () => void;
}

const PaymentMethodList: React.FC<PaymentMethodListProps> = ({ onAddClick }) => {
  const { paymentMethods, removePaymentMethod, setDefaultPaymentMethod, isLoading } = usePayment();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleRemove = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this payment method?')) {
      setProcessingId(id);
      try {
        await removePaymentMethod(id);
      } catch (error) {
        console.error('Error removing payment method:', error);
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    setProcessingId(id);
    try {
      await setDefaultPaymentMethod(id);
    } catch (error) {
      console.error('Error setting default payment method:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '/images/card-visa.svg';
      case 'mastercard':
        return '/images/card-mastercard.svg';
      case 'amex':
        return '/images/card-amex.svg';
      case 'discover':
        return '/images/card-discover.svg';
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <FaSpinner className="animate-spin text-indigo-600 mr-2" />
        <span>Loading payment methods...</span>
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-indigo-100 p-3">
            <FaCreditCard className="h-6 w-6 text-indigo-600" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Payment Methods</h3>
        <p className="text-gray-500 mb-4">
          You don't have any payment methods saved to your account yet.
        </p>
        <button
          onClick={onAddClick}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Payment Method
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Your Payment Methods</h3>
        <button
          onClick={onAddClick}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add New
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow divide-y">
        {paymentMethods.map((method) => (
          <div key={method.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              {method.card?.brand && getCardIcon(method.card.brand) ? (
                <img 
                  src={getCardIcon(method.card.brand)} 
                  alt={method.card.brand} 
                  className="h-8 w-auto mr-3"
                />
              ) : (
                <FaCreditCard className="h-5 w-5 text-gray-400 mr-3" />
              )}
              <div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">
                    {method.card ? `•••• ${method.card.last4}` : 'Payment Method'}
                  </span>
                  {method.isDefault && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Default
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {method.card && `${method.card.brand} - Expires ${method.card.expMonth}/${method.card.expYear}`}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              {!method.isDefault && (
                <button
                  onClick={() => handleSetDefault(method.id)}
                  disabled={processingId === method.id}
                  className="text-indigo-600 hover:text-indigo-900 p-1"
                  aria-label="Set as default"
                  title="Set as default"
                >
                  {processingId === method.id ? (
                    <FaSpinner className="animate-spin h-5 w-5" />
                  ) : (
                    <FaRegStar className="h-5 w-5" />
                  )}
                </button>
              )}
              <button
                onClick={() => handleRemove(method.id)}
                disabled={processingId === method.id}
                className="text-red-600 hover:text-red-900 p-1"
                aria-label="Remove payment method"
                title="Remove payment method"
              >
                {processingId === method.id ? (
                  <FaSpinner className="animate-spin h-5 w-5" />
                ) : (
                  <FaTrash className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodList; 