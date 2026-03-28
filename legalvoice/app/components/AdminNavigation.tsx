'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FaHome, 
  FaUsers, 
  FaFileAlt, 
  FaComments, 
  FaMoneyBillWave, 
  FaCalendarAlt, 
  FaChartBar, 
  FaCog
} from 'react-icons/fa';

export default function AdminNavigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path);
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: <FaHome className="text-lg" />
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: <FaUsers className="text-lg" />
    },
    {
      name: 'Documents',
      href: '/admin/documents',
      icon: <FaFileAlt className="text-lg" />
    },
    {
      name: 'Conversations',
      href: '/admin/conversations',
      icon: <FaComments className="text-lg" />
    },
    {
      name: 'Appointments',
      href: '/admin/appointments',
      icon: <FaCalendarAlt className="text-lg" />
    },
    {
      name: 'Billing & Revenue',
      href: '/admin/revenue',
      icon: <FaMoneyBillWave className="text-lg" />
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: <FaChartBar className="text-lg" />
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: <FaCog className="text-lg" />
    }
  ];

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      <div className="border-b border-gray-100 py-4 px-6">
        <h2 className="text-xl font-semibold text-gray-800">Admin Panel</h2>
      </div>
      <nav className="py-2">
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center py-3 px-6 hover:bg-gray-50 transition-colors ${
                  isActive(item.href)
                    ? 'text-indigo-600 bg-indigo-50 border-l-4 border-indigo-600'
                    : 'text-gray-700 border-l-4 border-transparent'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
} 