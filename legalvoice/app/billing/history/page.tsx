'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaDownload, FaEye, FaCalendarAlt, FaCreditCard } from 'react-icons/fa';
import { useAuth } from '@/app/lib/context/AuthContext';
import { usePayment } from '@/app/lib/context/PaymentContext';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import BillingNavigation from '@/app/components/BillingNavigation';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  description: string;
  downloadUrl?: string;
}

export default function BillingHistory() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { subscription, isLoadingSubscription } = usePayment();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      fetchInvoices();
    }
  }, [user, authLoading]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      // Mock data for now - would be replaced with actual API call
      const mockInvoices: Invoice[] = [
        {
          _id: '1',
          invoiceNumber: 'INV-2023-001',
          amount: 39.99,
          status: 'paid',
          date: '2023-12-01',
          description: 'Professional Plan - Monthly',
          downloadUrl: '#'
        },
        {
          _id: '2',
          invoiceNumber: 'INV-2023-002',
          amount: 39.99,
          status: 'paid',
          date: '2024-01-01',
          description: 'Professional Plan - Monthly',
          downloadUrl: '#'
        },
        {
          _id: '3',
          invoiceNumber: 'INV-2024-003',
          amount: 39.99,
          status: 'paid',
          date: '2024-02-01',
          description: 'Professional Plan - Monthly',
          downloadUrl: '#'
        },
        {
          _id: '4',
          invoiceNumber: 'INV-2024-004',
          amount: 39.99,
          status: 'paid',
          date: '2024-03-01',
          description: 'Professional Plan - Monthly',
          downloadUrl: '#'
        },
        {
          _id: '5',
          invoiceNumber: 'INV-2024-005',
          amount: 39.99,
          status: 'pending',
          date: '2024-04-01',
          description: 'Professional Plan - Monthly'
        }
      ];
      
      // Simulate API delay
      setTimeout(() => {
        setInvoices(mockInvoices);
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load billing history');
      setIsLoading(false);
    }
  };

  const viewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const downloadInvoice = (invoice: Invoice) => {
    if (!invoice.downloadUrl) {
      toast.error('Invoice download is not available for this transaction');
      return;
    }
    
    // In a real implementation, this would initiate a file download
    toast.success(`Downloading invoice ${invoice.invoiceNumber}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || isLoadingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading billing history..." />
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
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Billing History</h1>
            <p className="mt-2 text-gray-600">
              View and download your past invoices and billing information
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <BillingNavigation />
            </div>
            
            <div className="lg:col-span-3">
              {subscription ? (
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Subscription</h2>
                  <div className="flex flex-wrap items-center">
                    <div className="mr-8 mb-4">
                      <p className="text-sm text-gray-500">Plan</p>
                      <p className="font-medium">{subscription.planName}</p>
                    </div>
                    <div className="mr-8 mb-4">
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium">${subscription.price}/{subscription.interval}</p>
                    </div>
                    <div className="mr-8 mb-4">
                      <p className="text-sm text-gray-500">Next billing date</p>
                      <p className="font-medium flex items-center">
                        <FaCalendarAlt className="mr-2 text-indigo-500" />
                        {formatDate(subscription.nextBillingDate)}
                      </p>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-500">Payment method</p>
                      <p className="font-medium flex items-center">
                        <FaCreditCard className="mr-2 text-indigo-500" />
                        {subscription.paymentMethod}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <a 
                      href="/billing/plans" 
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Change plan
                    </a>
                    <span className="mx-3 text-gray-300">|</span>
                    <a 
                      href="/payments/settings" 
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Manage payment methods
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
                  <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Active Subscription</h2>
                  <p className="text-yellow-700 mb-4">
                    You don't have an active subscription. Choose a plan to access all features.
                  </p>
                  <a 
                    href="/billing/plans" 
                    className="inline-block bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition"
                  >
                    View Plans
                  </a>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-800">Transaction History</h2>
                </div>
                
                {isLoading ? (
                  <div className="p-8 flex justify-center">
                    <LoadingSpinner size="medium" text="Loading invoices..." />
                  </div>
                ) : invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invoice
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.map((invoice) => (
                          <tr key={invoice._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                              <div className="text-sm text-gray-500">{invoice.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatDate(invoice.date)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">${invoice.amount.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(invoice.status)}`}>
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => viewInvoice(invoice)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                <FaEye className="inline mr-1" /> View
                              </button>
                              <button
                                onClick={() => downloadInvoice(invoice)}
                                className={`${invoice.downloadUrl ? 'text-indigo-600 hover:text-indigo-900' : 'text-gray-400 cursor-not-allowed'}`}
                                disabled={!invoice.downloadUrl}
                              >
                                <FaDownload className="inline mr-1" /> Download
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 mb-4">No transaction history available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-[0.5] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  Invoice {selectedInvoice.invoiceNumber}
                </h3>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Invoice Number</p>
                  <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(selectedInvoice.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium">{selectedInvoice.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium capitalize">{selectedInvoice.status}</p>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-100 pt-6">
                <h4 className="text-lg font-semibold mb-4">Invoice Details</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subscription</span>
                    <span>{selectedInvoice.description}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${selectedInvoice.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Tax</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-4 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>${selectedInvoice.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                {selectedInvoice.downloadUrl && (
                  <button
                    onClick={() => downloadInvoice(selectedInvoice)}
                    className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center"
                  >
                    <FaDownload className="mr-2" /> Download PDF
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 