'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheckCircle, FaShoppingCart, FaCreditCard, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';
import StripeProvider from '@/app/components/payments/StripeProvider';
import CheckoutForm from '@/app/components/payments/CheckoutForm';

// Service plan types
interface ServicePlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  price: number;
  priceId: string;
  type: 'subscription' | 'one-time';
  billingPeriod?: string;
  popular?: boolean;
}

// Sample service plans
const legalServicePlans: ServicePlan[] = [
  {
    id: 'basic',
    name: 'Basic Legal Support',
    description: 'Essential legal document creation and analysis',
    features: [
      '5 document creations per month',
      '3 legal document analyses',
      'Basic AI legal assistant',
      'Email support',
    ],
    price: 4900,
    priceId: 'price_basic',
    type: 'subscription',
    billingPeriod: 'month',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Comprehensive legal services for individuals and small businesses',
    features: [
      '15 document creations per month',
      '10 legal document analyses',
      'Priority AI legal assistant',
      'Phone and email support',
      '1 lawyer consultation per month',
    ],
    price: 9900,
    priceId: 'price_professional',
    type: 'subscription',
    billingPeriod: 'month',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Complete legal solution for growing businesses',
    features: [
      'Unlimited document creations',
      'Unlimited legal document analyses',
      'Advanced AI legal assistant',
      'Priority support',
      '3 lawyer consultations per month',
      'Document management system',
    ],
    price: 19900,
    priceId: 'price_business',
    type: 'subscription',
    billingPeriod: 'month',
  },
  {
    id: 'consultation',
    name: 'Lawyer Consultation',
    description: 'One-time consultation with a qualified lawyer',
    features: [
      '60-minute video consultation',
      'Document review included',
      'Written summary of advice',
      'Follow-up email support',
    ],
    price: 14900,
    priceId: 'price_consultation',
    type: 'one-time',
  },
];

const oneTimeServices: ServicePlan[] = [
  {
    id: 'document_review',
    name: 'Document Review',
    description: 'Professional review of your legal document',
    features: [
      'Thorough analysis by AI and legal experts',
      'Feedback and recommendations',
      'Risk assessment',
      'Suggested improvements',
    ],
    price: 4900,
    priceId: 'price_document_review',
    type: 'one-time',
  },
  {
    id: 'draft_creation',
    name: 'Custom Document Drafting',
    description: 'Custom legal document drafted for your specific needs',
    features: [
      'Personalized document creation',
      'Legal compliance check',
      'Two rounds of revisions',
      'Final document in multiple formats',
    ],
    price: 9900,
    priceId: 'price_draft_creation',
    type: 'one-time',
  },
];

export default function Checkout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const serviceId = searchParams.get('service');
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/checkout' + (serviceId ? `?service=${serviceId}` : ''));
      return;
    }

    if (serviceId) {
      const plan = [...legalServicePlans, ...oneTimeServices].find(p => p.id === serviceId);
      if (plan) {
        setSelectedPlan(plan);
      } else {
        setError('The selected service plan was not found.');
      }
    }
  }, [serviceId, user, router]);

  const handlePaymentSuccess = (paymentId: string) => {
    setPaymentIntentId(paymentId);
    setPaymentSuccess(true);
    
    // You would typically make a backend call here to record the purchase
    // and provision the service for the user
    
    // Redirect after a delay
    setTimeout(() => {
      router.push('/user/dashboard');
    }, 3000);
  };

  if (!user) {
    return null; // Will redirect to login in useEffect
  }

  if (paymentSuccess) {
    return (
      <main className="min-h-screen pt-32 pb-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-md">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for your purchase. Your transaction has been completed successfully.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Transaction ID: {paymentIntentId?.slice(0, 8)}...
            </p>
            <p className="text-sm text-gray-500">
              You will be redirected to your dashboard shortly.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!selectedPlan) {
    return (
      <main className="min-h-screen pt-32 pb-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Choose a Plan</h1>
            <p className="mt-2 text-gray-600">
              Select the legal service plan that fits your needs
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 flex items-start">
              <FaInfoCircle className="flex-shrink-0 h-5 w-5 mr-2 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <h2 className="text-xl font-semibold mb-6">Subscription Plans</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {legalServicePlans.map((plan) => (
              <div 
                key={plan.id}
                className={`border rounded-lg overflow-hidden ${plan.popular ? 'border-indigo-500 shadow-lg' : 'border-gray-200 shadow'}`}
              >
                {plan.popular && (
                  <div className="bg-indigo-500 text-white text-center py-2 text-sm font-medium">
                    MOST POPULAR
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-extrabold text-gray-900">
                      ${(plan.price / 100).toFixed(2)}
                    </span>
                    <span className="ml-1 text-xl font-medium text-gray-500">
                      /{plan.billingPeriod}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-600">{plan.description}</p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <FaCheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <button
                      onClick={() => router.push(`/checkout?service=${plan.id}`)}
                      className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                        plan.popular
                          ? 'bg-indigo-600 hover:bg-indigo-700'
                          : 'bg-indigo-500 hover:bg-indigo-600'
                      }`}
                    >
                      <FaShoppingCart className="mr-2" />
                      Select Plan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-semibold mb-6">One-Time Services</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {oneTimeServices.map((service) => (
              <div 
                key={service.id}
                className="border border-gray-200 rounded-lg overflow-hidden shadow"
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-extrabold text-gray-900">
                      ${(service.price / 100).toFixed(2)}
                    </span>
                    <span className="ml-1 text-xl font-medium text-gray-500">
                      one-time
                    </span>
                  </div>
                  <p className="mt-2 text-gray-600">{service.description}</p>
                  <ul className="mt-6 space-y-3">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <FaCheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <button
                      onClick={() => router.push(`/checkout?service=${service.id}`)}
                      className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-500 hover:bg-indigo-600"
                    >
                      <FaShoppingCart className="mr-2" />
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="mt-2 text-gray-600">
            Complete your purchase to access premium legal services
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <FaCreditCard className="mr-2 text-indigo-600" />
                Payment Details
              </h2>
              
              <StripeProvider>
                <CheckoutForm 
                  amount={selectedPlan.price}
                  currency="usd"
                  description={`Payment for ${selectedPlan.name} ${selectedPlan.type === 'subscription' ? 'subscription' : 'service'}`}
                  onSuccess={handlePaymentSuccess}
                />
              </StripeProvider>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-32">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="border-t border-b py-4 my-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{selectedPlan.name}</span>
                  <span>${(selectedPlan.price / 100).toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{selectedPlan.description}</p>
                
                {selectedPlan.type === 'subscription' && (
                  <div className="text-sm text-gray-600 bg-indigo-50 p-3 rounded-md">
                    <FaInfoCircle className="inline-block mr-1 text-indigo-500" />
                    You will be charged ${(selectedPlan.price / 100).toFixed(2)} every {selectedPlan.billingPeriod} until you cancel.
                  </div>
                )}
              </div>
              
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>Total</span>
                <span>${(selectedPlan.price / 100).toFixed(2)} {selectedPlan.type === 'subscription' ? `/${selectedPlan.billingPeriod}` : ''}</span>
              </div>
              
              <div className="mt-6 text-sm text-gray-600">
                <p className="flex items-start mb-2">
                  <FaCheckCircle className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  Secure payment processing
                </p>
                {selectedPlan.type === 'subscription' && (
                  <p className="flex items-start mb-2">
                    <FaCheckCircle className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    Cancel anytime from your account
                  </p>
                )}
                <p className="flex items-start">
                  <FaCheckCircle className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  24/7 customer support
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 