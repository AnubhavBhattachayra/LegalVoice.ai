'use client';

import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePayment } from '@/app/context/PaymentContext';
import { FaLock, FaSpinner } from 'react-icons/fa';

interface PaymentMethodFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { addPaymentMethod } = usePayment();
  
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setBillingDetails({
        ...billingDetails,
        [parent]: {
          ...billingDetails[parent as keyof typeof billingDetails] as any,
          [child]: value,
        },
      });
    } else {
      setBillingDetails({ ...billingDetails, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    if (!cardComplete) {
      setError('Please complete card details');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: billingDetails,
      });

      if (createError) {
        throw new Error(createError.message);
      }

      if (paymentMethod) {
        await addPaymentMethod(paymentMethod.id);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Payment method error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Cardholder Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={billingDetails.name}
            onChange={handleChange}
            placeholder="Name on card"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={billingDetails.email}
            onChange={handleChange}
            placeholder="Email address"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2 md:gap-x-4">
          <div>
            <label htmlFor="address.line1" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              id="address.line1"
              name="address.line1"
              type="text"
              required
              value={billingDetails.address.line1}
              onChange={handleChange}
              placeholder="Street address"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              id="address.city"
              name="address.city"
              type="text"
              required
              value={billingDetails.address.city}
              onChange={handleChange}
              placeholder="City"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-y-4 md:grid-cols-3 md:gap-x-4">
          <div>
            <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
              State
            </label>
            <input
              id="address.state"
              name="address.state"
              type="text"
              required
              value={billingDetails.address.state}
              onChange={handleChange}
              placeholder="State"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="address.postal_code" className="block text-sm font-medium text-gray-700">
              ZIP Code
            </label>
            <input
              id="address.postal_code"
              name="address.postal_code"
              type="text"
              required
              value={billingDetails.address.postal_code}
              onChange={handleChange}
              placeholder="ZIP"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={billingDetails.phone}
              onChange={handleChange}
              placeholder="Phone number"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="border border-gray-300 rounded-md p-3 shadow-sm focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
              onChange={(e) => {
                setCardComplete(e.complete);
                if (e.error) {
                  setError(e.error.message);
                } else {
                  setError(null);
                }
              }}
            />
          </div>
          <div className="flex items-center mt-1">
            <FaLock className="text-xs text-gray-500 mr-1" />
            <span className="text-xs text-gray-500">Your payment information is secure</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!stripe || processing || !cardComplete}
          className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
            ${!stripe || processing || !cardComplete
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            } flex items-center`}
        >
          {processing ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Processing...
            </>
          ) : (
            'Add Payment Method'
          )}
        </button>
      </div>
    </form>
  );
};

export default PaymentMethodForm; 