'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaFileInvoice, 
  FaDownload, 
  FaSearch, 
  FaSpinner, 
  FaArrowLeft,
  FaExclamationTriangle,
  FaPrint
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

// Invoice interface
interface Invoice {
  id: string;
  number: string;
  date: number;
  amount: number;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  items?: {
    description: string;
    amount: number;
    quantity: number;
  }[];
  pdf?: string;
}

const InvoicesPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Mock invoices data
  const mockInvoices: Invoice[] = [
    {
      id: 'inv_123456',
      number: 'INV-001',
      date: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
      amount: 29.99,
      status: 'paid',
      items: [
        {
          description: 'Professional Plan - Monthly Subscription',
          amount: 29.99,
          quantity: 1
        }
      ],
      pdf: '/invoices/INV-001.pdf'
    },
    {
      id: 'inv_123457',
      number: 'INV-002',
      date: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
      amount: 29.99,
      status: 'paid',
      items: [
        {
          description: 'Professional Plan - Monthly Subscription',
          amount: 29.99,
          quantity: 1
        }
      ],
      pdf: '/invoices/INV-002.pdf'
    },
    {
      id: 'inv_123458',
      number: 'INV-003',
      date: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
      amount: 29.99,
      status: 'paid',
      items: [
        {
          description: 'Professional Plan - Monthly Subscription',
          amount: 29.99,
          quantity: 1
        }
      ],
      pdf: '/invoices/INV-003.pdf'
    },
    {
      id: 'inv_123459',
      number: 'INV-004',
      date: Date.now() - 120 * 24 * 60 * 60 * 1000, // 120 days ago
      amount: 29.99,
      status: 'paid',
      items: [
        {
          description: 'Professional Plan - Monthly Subscription',
          amount: 29.99,
          quantity: 1
        }
      ],
      pdf: '/invoices/INV-004.pdf'
    },
    {
      id: 'inv_123460',
      number: 'INV-005',
      date: Date.now() - 150 * 24 * 60 * 60 * 1000, // 150 days ago
      amount: 9.99,
      status: 'paid',
      items: [
        {
          description: 'Basic Plan - Monthly Subscription',
          amount: 9.99,
          quantity: 1
        }
      ],
      pdf: '/invoices/INV-005.pdf'
    },
    {
      id: 'inv_123461',
      number: 'INV-006',
      date: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
      amount: 29.99,
      status: 'open',
      items: [
        {
          description: 'Professional Plan - Monthly Subscription',
          amount: 29.99,
          quantity: 1
        }
      ]
    }
  ];
  
  // Load user data
  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login?redirect=/billing/invoices');
      return;
    }
    
    if (user) {
      // In a real app, this would be an API call
      setTimeout(() => {
        setInvoices(mockInvoices);
        setFilteredInvoices(mockInvoices);
        setIsLoading(false);
      }, 1000);
    }
  }, [user, authLoading, router]);
  
  // Filter invoices when search or filters change
  useEffect(() => {
    if (invoices.length === 0) return;
    
    let filtered = [...invoices];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.number.toLowerCase().includes(query)
      );
    }
    
    // Filter by year
    if (yearFilter !== 'all') {
      const year = parseInt(yearFilter);
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate.getFullYear() === year;
      });
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }
    
    setFilteredInvoices(filtered);
  }, [invoices, searchQuery, yearFilter, statusFilter]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Extract years from invoices for the year filter
  const getInvoiceYears = () => {
    const years = new Set<number>();
    invoices.forEach(invoice => {
      const year = new Date(invoice.date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Paid
          </span>
        );
      case 'open':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Open
          </span>
        );
      case 'void':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Void
          </span>
        );
      case 'uncollectible':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Uncollectible
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };
  
  // View PDF invoice (this would typically open in a new tab or download)
  const viewInvoice = (invoice: Invoice) => {
    if (invoice.pdf) {
      window.open(invoice.pdf, '_blank');
    } else {
      alert('PDF not available for this invoice yet.');
    }
  };
  
  // Print invoice
  const printInvoice = (invoice: Invoice) => {
    // In a real app, this would open a print-friendly version
    alert('Print functionality would be implemented here.');
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
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <Link 
            href="/billing" 
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <FaArrowLeft className="mr-2" />
            Back to Billing
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Invoices & Billing History</h1>
        
        {/* Search and filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-grow">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  placeholder="Search by invoice number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="w-full lg:w-48">
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                id="year"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Years</option>
                {getInvoiceYears().map(year => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full lg:w-48">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="open">Open</option>
                <option value="void">Void</option>
                <option value="uncollectible">Uncollectible</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Invoices table */}
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FaExclamationTriangle className="text-yellow-500 text-4xl mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">No invoices found</h2>
            <p className="text-gray-600 mb-4">
              {invoices.length > 0 
                ? "Try adjusting your search criteria."
                : "No billing history is available yet."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Invoice</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaFileInvoice className="text-gray-400 mr-3" />
                          <span className="font-medium text-gray-900">{invoice.number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(invoice.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          {invoice.pdf && (
                            <button
                              onClick={() => viewInvoice(invoice)}
                              className="text-indigo-600 hover:text-indigo-800"
                              title="Download PDF"
                            >
                              <FaDownload />
                            </button>
                          )}
                          <button
                            onClick={() => printInvoice(invoice)}
                            className="text-gray-600 hover:text-gray-800"
                            title="Print invoice"
                          >
                            <FaPrint />
                          </button>
                          <Link
                            href={`/billing/invoices/${invoice.id}`}
                            className="text-indigo-600 hover:text-indigo-800 ml-3"
                          >
                            View details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Need help section */}
        <div className="mt-8 bg-indigo-50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Need help with your billing?</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about your invoices or billing, our customer support team is here to help.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  );
};

export default InvoicesPage; 