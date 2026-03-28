'use client';

import React, { useState } from 'react';
import { usePayment } from '@/app/lib/context/PaymentContext';
import { FaCreditCard, FaHistory, FaPlus, FaTimes } from 'react-icons/fa';
import StripeProvider from '@/app/components/payments/StripeProvider';
import PaymentMethodList from '@/app/components/payments/PaymentMethodList';
import PaymentMethodForm from '@/app/components/payments/PaymentMethodForm';
import TransactionHistory from '@/app/components/payments/TransactionHistory';
import Modal from '@/app/components/Modal';

enum Tab {
  PaymentMethods = 'payment-methods',
  TransactionHistory = 'transaction-history',
}

export default function PaymentSettings() {
  const { isLoading } = usePayment();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.PaymentMethods);
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);

  const handleAddPaymentMethodClick = () => {
    setIsAddingPaymentMethod(true);
  };

  const handlePaymentMethodAdded = () => {
    setIsAddingPaymentMethod(false);
  };

  const handleCancelAddPaymentMethod = () => {
    setIsAddingPaymentMethod(false);
  };

  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Payment Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your payment methods and view your transaction history
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab(Tab.PaymentMethods)}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === Tab.PaymentMethods
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaCreditCard className="inline-block mr-2 h-4 w-4" />
                Payment Methods
              </button>
              <button
                onClick={() => setActiveTab(Tab.TransactionHistory)}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === Tab.TransactionHistory
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaHistory className="inline-block mr-2 h-4 w-4" />
                Transaction History
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === Tab.PaymentMethods && (
              <div>
                <StripeProvider>
                  <PaymentMethodList onAddClick={handleAddPaymentMethodClick} />
                  
                  <Modal
                    isOpen={isAddingPaymentMethod}
                    onClose={handleCancelAddPaymentMethod}
                    title="Add Payment Method"
                  >
                    <PaymentMethodForm
                      onSuccess={handlePaymentMethodAdded}
                      onCancel={handleCancelAddPaymentMethod}
                    />
                  </Modal>
                </StripeProvider>
              </div>
            )}

            {activeTab === Tab.TransactionHistory && (
              <TransactionHistory showSearch showFilters />
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 