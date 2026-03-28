'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from '../lib/context/AuthContext';
import { asyncHandler } from '../lib/utils/errorHandler';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  bankName?: string;
  isDefault: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  credits: number;
}

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  planId: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface PaymentContextType {
  paymentMethods: PaymentMethod[];
  subscription: Subscription | null;
  availablePlans: SubscriptionPlan[];
  isLoading: boolean;
  addPaymentMethod: (paymentMethod: Omit<PaymentMethod, 'id'>) => Promise<boolean>;
  removePaymentMethod: (id: string) => Promise<boolean>;
  setDefaultPaymentMethod: (id: string) => Promise<boolean>;
  updateSubscription: (planId: string) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load payment data when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadPaymentData = async () => {
      setIsLoading(true);
      try {
        // This would be replaced with actual API calls
        // Mock data for now
        setPaymentMethods([
          {
            id: 'pm_123',
            type: 'card',
            last4: '4242',
            brand: 'Visa',
            expMonth: 12,
            expYear: 2025,
            isDefault: true
          }
        ]);

        setSubscription({
          id: 'sub_123',
          status: 'active',
          planId: 'plan_monthly_pro',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false
        });

        setAvailablePlans([
          {
            id: 'plan_monthly_basic',
            name: 'Basic',
            price: 9.99,
            interval: 'month',
            features: ['10 documents per month', 'Basic analysis', 'Email support'],
            credits: 100
          },
          {
            id: 'plan_monthly_pro',
            name: 'Professional',
            price: 19.99,
            interval: 'month',
            features: ['Unlimited documents', 'Advanced analysis', 'Priority support', 'API access'],
            credits: 500
          }
        ]);
      } catch (error) {
        console.error('Error loading payment data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentData();
  }, [isAuthenticated, user?.id]);

  // Add a new payment method
  const addPaymentMethod = useCallback(async (paymentMethod: Omit<PaymentMethod, 'id'>): Promise<boolean> => {
    return await asyncHandler(async () => {
      setIsLoading(true);
      
      // Mock implementation - would call API in real app
      const newMethod: PaymentMethod = {
        ...paymentMethod,
        id: `pm_${Date.now()}`
      };
      
      // If this is the first payment method or marked as default
      if (paymentMethods.length === 0 || paymentMethod.isDefault) {
        setPaymentMethods(prev => 
          prev.map(pm => ({ ...pm, isDefault: false })).concat({ ...newMethod, isDefault: true })
        );
      } else {
        setPaymentMethods(prev => [...prev, newMethod]);
      }
      
      setIsLoading(false);
      return true;
    }) ?? false;
  }, [paymentMethods]);

  // Remove a payment method
  const removePaymentMethod = useCallback(async (id: string): Promise<boolean> => {
    return await asyncHandler(async () => {
      setIsLoading(true);
      
      // Check if this is the default payment method
      const isDefault = paymentMethods.find(pm => pm.id === id)?.isDefault || false;
      
      // Filter out the removed payment method
      const updatedMethods = paymentMethods.filter(pm => pm.id !== id);
      
      // If we removed the default method, set a new default
      if (isDefault && updatedMethods.length > 0) {
        updatedMethods[0].isDefault = true;
      }
      
      setPaymentMethods(updatedMethods);
      setIsLoading(false);
      return true;
    }) ?? false;
  }, [paymentMethods]);

  // Set a payment method as default
  const setDefaultPaymentMethod = useCallback(async (id: string): Promise<boolean> => {
    return await asyncHandler(async () => {
      setIsLoading(true);
      
      setPaymentMethods(prev => 
        prev.map(pm => ({
          ...pm,
          isDefault: pm.id === id
        }))
      );
      
      setIsLoading(false);
      return true;
    }) ?? false;
  }, []);

  // Update subscription plan
  const updateSubscription = useCallback(async (planId: string): Promise<boolean> => {
    return await asyncHandler(async () => {
      setIsLoading(true);
      
      // Mock implementation
      setSubscription(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          planId,
          // Update the period end date for demo purposes
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
      });
      
      setIsLoading(false);
      return true;
    }) ?? false;
  }, []);

  // Cancel subscription
  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    return await asyncHandler(async () => {
      setIsLoading(true);
      
      setSubscription(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          cancelAtPeriodEnd: true
        };
      });
      
      setIsLoading(false);
      return true;
    }) ?? false;
  }, []);

  const value = useMemo(
    () => ({
      paymentMethods,
      subscription,
      availablePlans,
      isLoading,
      addPaymentMethod,
      removePaymentMethod,
      setDefaultPaymentMethod,
      updateSubscription,
      cancelSubscription,
    }),
    [
      paymentMethods,
      subscription,
      availablePlans,
      isLoading,
      addPaymentMethod,
      removePaymentMethod,
      setDefaultPaymentMethod,
      updateSubscription,
      cancelSubscription,
    ]
  );

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
}; 