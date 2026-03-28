'use client';

import React, { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { usePayment } from '@/app/context/PaymentContext';
import { FaSpinner, FaLock, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';

interface CheckoutFormProps {
  amount: number;
  currency?: string;
  description: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel?: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  amount,
  currency = 'usd',
  description,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { paymentMethods, createPaymentIntent } = usePayment();
  
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | 'new'>('new');
  
  // Create a payment intent when the component loads
  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        const response = await createPaymentIntent(amount, currency);
        setClientSecret(response.clientSecret);
      } catch (err) {
        setError('Failed to initialize payment. Please try again later.');
        console.error('Error creating payment intent:', err);
      }
    };
    
    fetchPaymentIntent();
  }, [amount, currency, createPaymentIntent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      let paymentResult;
      
      if (selectedPaymentMethodId === 'new') {
        // Pay with new card
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card element not found');
        }
        
        paymentResult = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: 'Anonymous User', // You might want to get this from a form
            },
          },
        });
      } else {
        // Pay with saved payment method
        paymentResult = await stripe.confirmCardPayment(clientSecret, {
          payment_method: selectedPaymentMethodId,
        });
      }
      
      if (paymentResult.error) {
        throw new Error(paymentResult.error.message);
      }
      
      if (paymentResult.paymentIntent?.status === 'succeeded') {
        setSucceeded(true);
        onSuccess(paymentResult.paymentIntent.id);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPaymentMethodId(e.target.value);
  };

  if (succeeded) {
    return (
      <div className="text-center p-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaCheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Payment Successful!</h3>
        <p className="text-gray-500 mt-2">
          Thank you for your payment. Your transaction has been completed successfully.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="bg-indigo-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Checkout</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency.toUpperCase(),
                }).format(amount / 100)}
              </p>
            </div>
          </div>
        </div>

        {paymentMethods.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Payment Method</h4>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center">
                  <input
                    id={`payment-method-${method.id}`}
                    name="paymentMethod"
                    type="radio"
                    value={method.id}
                    checked={selectedPaymentMethodId === method.id}
                    onChange={handlePaymentMethodChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label
                    htmlFor={`payment-method-${method.id}`}
                    className="ml-3 flex items-center"
                  >
                    <span className="text-gray-900">
                      {method.card?.brand.charAt(0).toUpperCase() + method.card?.brand.slice(1)} •••• {method.card?.last4}
                    </span>
                    {method.isDefault && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Default
                      </span>
                    )}
                  </label>
                </div>
              ))}
              <div className="flex items-center">
                <input
                  id="payment-method-new"
                  name="paymentMethod"
                  type="radio"
                  value="new"
                  checked={selectedPaymentMethodId === 'new'}
                  onChange={handlePaymentMethodChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="payment-method-new" className="ml-3 text-gray-900">
                  Use a new card
                </label>
              </div>
            </div>
          </div>
        )}

        {selectedPaymentMethodId === 'new' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Details
            </label>
            <div className="border border-gray-300 rounded-md p-4 shadow-sm focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500">
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
              />
            </div>
            <div className="flex items-center mt-1">
              <FaLock className="text-xs text-gray-500 mr-1" />
              <span className="text-xs text-gray-500">
                Payments are secure and encrypted
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded flex items-start">
          <FaInfoCircle className="flex-shrink-0 h-5 w-5 mr-2 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={processing}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!stripe || !clientSecret || processing}
          className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
            ${!stripe || !clientSecret || processing
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
            `Pay ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency.toUpperCase(),
            }).format(amount / 100)}`
          )}
        </button>
      </div>
    </form>
  );
};

export default CheckoutForm; 