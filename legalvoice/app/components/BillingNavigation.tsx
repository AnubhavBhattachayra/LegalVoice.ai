'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaCreditCard, FaHistory, FaCrown, FaHome } from 'react-icons/fa';

export default function BillingNavigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path);
  };

  const navItems = [
    {
      name: 'Overview',
      href: '/billing',
      icon: <FaHome />,
      exact: true
    },
    {
      name: 'Subscription Plans',
      href: '/billing/plans',
      icon: <FaCrown />
    },
    {
      name: 'Billing History',
      href: '/billing/history',
      icon: <FaHistory />
    },
    {
      name: 'Payment Methods',
      href: '/payments/settings',
      icon: <FaCreditCard />
    }
  ];

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden mb-8">
      <div className="border-b border-gray-100 py-4 px-6">
        <h2 className="text-xl font-semibold text-gray-800">Billing</h2>
      </div>
      <nav className="py-2">
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center py-3 px-6 hover:bg-gray-50 transition-colors ${
                  (item.exact 
                    ? pathname === item.href
                    : isActive(item.href))
                    ? 'text-indigo-600 bg-indigo-50 border-l-4 border-indigo-600'
                    : 'text-gray-700 border-l-4 border-transparent'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
                {(item.exact 
                  ? pathname === item.href
                  : isActive(item.href)) && (
                  <span className="ml-auto bg-indigo-100 text-indigo-800 text-xs rounded-full px-2 py-1">
                    Current
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
} 