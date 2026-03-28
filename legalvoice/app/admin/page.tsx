'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUsers, FaFileAlt, FaComments, FaCreditCard, FaUserShield, FaExclamationTriangle, FaSearch, FaTachometerAlt, FaUserPlus, FaChartLine, FaSitemap, FaCog } from 'react-icons/fa';
import { useAuth } from '@/app/lib/context/AuthContext';
import LoadingSpinner from '@/app/components/LoadingSpinner';

// Mock data for the dashboard
const DASHBOARD_STATS = {
  users: {
    total: 1248,
    active: 856,
    new: 142,
    growth: 12.5
  },
  documents: {
    total: 5723,
    created: 834,
    analyzed: 2156,
    growth: 28.3
  },
  subscriptions: {
    total: 625,
    basic: 312,
    pro: 245,
    enterprise: 68,
    revenue: '$24,680'
  },
  support: {
    total: 128,
    open: 42,
    resolved: 86,
    avgTime: '6h 23m'
  }
};

const AdminDashboard = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user has admin role
      if (user.role === 'admin') {
        setIsAuthorized(true);
      } else {
        router.push('/unauthorized');
      }
      
      setIsLoading(false);
    }
  }, [user, loading, router]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading admin dashboard..." />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.firstName || 'Admin'}!</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users, documents..."
                className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
              <div className="p-3 bg-indigo-100 rounded-full">
                <FaUsers className="text-indigo-600" />
              </div>
            </div>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-gray-800">{DASHBOARD_STATS.users.total}</p>
              <span className="ml-2 text-sm font-medium text-green-600">
                +{DASHBOARD_STATS.users.growth}%
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {DASHBOARD_STATS.users.active} active users
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Documents</h3>
              <div className="p-3 bg-blue-100 rounded-full">
                <FaFileAlt className="text-blue-600" />
              </div>
            </div>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-gray-800">{DASHBOARD_STATS.documents.total}</p>
              <span className="ml-2 text-sm font-medium text-green-600">
                +{DASHBOARD_STATS.documents.growth}%
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {DASHBOARD_STATS.documents.created} created this month
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Subscriptions</h3>
              <div className="p-3 bg-green-100 rounded-full">
                <FaCreditCard className="text-green-600" />
              </div>
            </div>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-gray-800">{DASHBOARD_STATS.subscriptions.total}</p>
              <span className="ml-2 text-sm font-medium text-green-600">
                {DASHBOARD_STATS.subscriptions.revenue}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {DASHBOARD_STATS.subscriptions.pro} pro subscribers
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Support Tickets</h3>
              <div className="p-3 bg-yellow-100 rounded-full">
                <FaComments className="text-yellow-600" />
              </div>
            </div>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-gray-800">{DASHBOARD_STATS.support.total}</p>
              <span className="ml-2 text-sm font-medium text-orange-600">
                {DASHBOARD_STATS.support.open} open
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Avg. resolution time: {DASHBOARD_STATS.support.avgTime}
            </p>
          </div>
        </div>
        
        {/* Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {[
                  { user: 'Rahul Sharma', action: 'upgraded to Pro subscription', time: '15 minutes ago' },
                  { user: 'Priya Patel', action: 'created a new document', time: '43 minutes ago' },
                  { user: 'Vikram Singh', action: 'submitted a support ticket', time: '1 hour ago' },
                  { user: 'Ananya Desai', action: 'completed account verification', time: '2 hours ago' },
                  { user: 'Rajiv Kumar', action: 'requested a refund', time: '3 hours ago' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-800">{activity.user}</p>
                      <p className="text-gray-600 text-sm">{activity.action}</p>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/admin/activity" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  View All Activity →
                </Link>
              </div>
            </div>
          </div>
          
          <div className="col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">API Service</p>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">Database</p>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">Storage</p>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">AI Service</p>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Degraded</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">Payment Processing</p>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Operational</span>
                </div>
              </div>
              <div className="mt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FaExclamationTriangle className="text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">AI Service Issue</h4>
                      <p className="text-xs text-yellow-700 mt-1">
                        The AI document analysis service is experiencing higher than normal latency. Our team is investigating.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Access */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Access</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: <FaUsers />, title: 'User Management', link: '/admin/users' },
              { icon: <FaFileAlt />, title: 'Documents', link: '/admin/documents' },
              { icon: <FaCreditCard />, title: 'Subscriptions', link: '/admin/subscriptions' },
              { icon: <FaComments />, title: 'Support Tickets', link: '/admin/support' },
              { icon: <FaChartLine />, title: 'Analytics', link: '/admin/analytics' },
              { icon: <FaCog />, title: 'Settings', link: '/admin/settings' },
              { icon: <FaUserPlus />, title: 'Add User', link: '/admin/users/add' },
              { icon: <FaUserShield />, title: 'Permissions', link: '/admin/permissions' },
              { icon: <FaTachometerAlt />, title: 'Performance', link: '/admin/performance' },
              { icon: <FaSitemap />, title: 'Site Content', link: '/admin/content' },
            ].map((item, index) => (
              <Link
                key={index}
                href={item.link}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
              >
                <div className="text-indigo-600 text-xl mb-2">{item.icon}</div>
                <span className="text-sm text-gray-700 text-center">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard; 