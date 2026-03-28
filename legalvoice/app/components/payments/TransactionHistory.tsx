'use client';

import React, { useEffect } from 'react';
import { usePayment } from '@/app/context/PaymentContext';
import { FaFileInvoiceDollar, FaSearch, FaSpinner, FaDownload, FaInfoCircle } from 'react-icons/fa';

interface TransactionHistoryProps {
  limit?: number;
  showSearch?: boolean;
  showFilters?: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  limit,
  showSearch = false,
  showFilters = false,
}) => {
  const { transactionHistory, fetchTransactionHistory, isLoading } = usePayment();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string | null>(null);
  const [filteredTransactions, setFilteredTransactions] = React.useState(transactionHistory);

  useEffect(() => {
    fetchTransactionHistory();
  }, [fetchTransactionHistory]);

  useEffect(() => {
    let filtered = [...transactionHistory];

    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus) {
      filtered = filtered.filter((transaction) => transaction.status === filterStatus);
    }

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    setFilteredTransactions(filtered);
  }, [transactionHistory, searchTerm, filterStatus, limit]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value === 'all' ? null : e.target.value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadInvoice = (transactionId: string) => {
    // This would be implemented with a backend call
    console.log(`Downloading invoice for transaction ${transactionId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <FaSpinner className="animate-spin text-indigo-600 mr-2" />
        <span>Loading transaction history...</span>
      </div>
    );
  }

  if (transactionHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-indigo-100 p-3">
            <FaFileInvoiceDollar className="h-6 w-6 text-indigo-600" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Transactions</h3>
        <p className="text-gray-500">
          You don't have any transactions in your history yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(showSearch || showFilters) && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {showSearch && (
            <div className="relative rounded-md shadow-sm flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search transactions"
              />
            </div>
          )}

          {showFilters && (
            <div className="flex-1 sm:max-w-xs">
              <select
                value={filterStatus || 'all'}
                onChange={handleStatusFilter}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full py-2 pl-3 pr-10 text-base border-gray-300 rounded-md"
              >
                <option value="all">All statuses</option>
                <option value="succeeded">Succeeded</option>
                <option value="processing">Processing</option>
                <option value="requires_payment_method">Requires Payment Method</option>
                <option value="canceled">Canceled</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          )}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredTransactions.map((transaction) => (
            <li key={transaction.id}>
              <div className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {transaction.description}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1).replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {transaction.paymentMethod.type.charAt(0).toUpperCase() +
                          transaction.paymentMethod.type.slice(1)}
                        {transaction.paymentMethod.last4 && (
                          <span className="ml-1">•••• {transaction.paymentMethod.last4}</span>
                        )}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <span className="font-medium text-gray-900">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: transaction.currency.toUpperCase(),
                          }).format(transaction.amount / 100)}
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>{formatDate(transaction.date)}</p>
                      {transaction.status === 'succeeded' && (
                        <button
                          onClick={() => downloadInvoice(transaction.id)}
                          className="ml-4 text-indigo-600 hover:text-indigo-900"
                          title="Download invoice"
                        >
                          <FaDownload className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TransactionHistory; 