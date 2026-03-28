'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaUsers, 
  FaFileAlt, 
  FaComments, 
  FaMoneyBillWave, 
  FaUserPlus, 
  FaCalendarCheck,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaEllipsisH
} from 'react-icons/fa';
import { useAuth } from '@/app/lib/context/AuthContext';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Link from 'next/link';
import AdminNavigation from '@/app/components/AdminNavigation';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
  linkHref?: string;
  bgColor?: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  change, 
  linkHref,
  bgColor = 'bg-white'
}) => {
  return (
    <div className={`${bgColor} rounded-xl shadow-md p-6 flex flex-col h-full`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
          {icon}
        </div>
        {linkHref && (
          <Link href={linkHref} className="text-gray-400 hover:text-gray-600">
            <FaEllipsisH />
          </Link>
        )}
      </div>
      
      <h3 className="text-gray-600 font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-4">{value}</p>
      
      {change && (
        <div className="mt-auto">
          <span className={`inline-flex items-center text-sm font-medium ${
            change.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {change.isPositive ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
            {Math.abs(change.value)}% from last month
          </span>
        </div>
      )}
    </div>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    totalDocuments: 0,
    documentUploadsThisMonth: 0,
    totalChats: 0,
    activeChats: 0,
    totalRevenue: 0,
    revenueThisMonth: 0,
    pendingAppointments: 0
  });

  // Mock data for charts
  const [userGrowthData, setUserGrowthData] = useState<ChartData>({
    labels: [],
    datasets: [{ label: 'New Users', data: [] }]
  });

  const [revenueData, setRevenueData] = useState<ChartData>({
    labels: [],
    datasets: [{ label: 'Revenue', data: [] }]
  });

  useEffect(() => {
    if (user && !authLoading) {
      // Check if user is admin
      if (user.role !== 'admin') {
        router.push('/unauthorized');
        return;
      }
      
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call to get dashboard data
      // Using mock data for now
      setTimeout(() => {
        setDashboardData({
          totalUsers: 1458,
          activeUsers: 982,
          newUsersThisMonth: 124,
          totalDocuments: 3567,
          documentUploadsThisMonth: 342,
          totalChats: 5284,
          activeChats: 127,
          totalRevenue: 28945.67,
          revenueThisMonth: 4265.89,
          pendingAppointments: 18
        });

        // Set mock chart data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        setUserGrowthData({
          labels: months,
          datasets: [{ 
            label: 'New Users', 
            data: [65, 78, 90, 105, 117, 124] 
          }]
        });

        setRevenueData({
          labels: months,
          datasets: [{ 
            label: 'Revenue', 
            data: [3250, 3700, 3900, 4100, 4300, 4265] 
          }]
        });

        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    router.push('/unauthorized');
    return null;
  }

  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="mt-1 text-gray-600">
                Overview of platform metrics and performance
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link
                href="/admin/reports"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                Generate Reports
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <AdminNavigation />
            </div>
            
            <div className="lg:col-span-3">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                  title="Total Users"
                  value={dashboardData.totalUsers.toLocaleString()}
                  icon={<FaUsers size={20} />}
                  change={{ value: 8.5, isPositive: true }}
                  linkHref="/admin/users"
                />
                <MetricCard
                  title="New Users (This Month)"
                  value={dashboardData.newUsersThisMonth.toLocaleString()}
                  icon={<FaUserPlus size={20} />}
                  change={{ value: 12.3, isPositive: true }}
                />
                <MetricCard
                  title="Active Chats"
                  value={dashboardData.activeChats.toLocaleString()}
                  icon={<FaComments size={20} />}
                  change={{ value: 5.2, isPositive: true }}
                  linkHref="/admin/chats"
                />
                <MetricCard
                  title="Monthly Revenue"
                  value={`$${dashboardData.revenueThisMonth.toLocaleString()}`}
                  icon={<FaMoneyBillWave size={20} />}
                  change={{ value: 3.8, isPositive: false }}
                  linkHref="/admin/revenue"
                />
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-md p-6 h-full">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">User Growth</h2>
                    <div className="h-64 flex items-center justify-center">
                      {/* In a real app, this would be a chart component */}
                      <div className="w-full h-full flex flex-col">
                        <div className="flex justify-between mb-2">
                          {userGrowthData.labels.map((month, index) => (
                            <div key={index} className="text-xs text-gray-500">{month}</div>
                          ))}
                        </div>
                        <div className="flex-1 relative">
                          <div className="absolute inset-0 flex items-end">
                            {userGrowthData.datasets[0].data.map((value, index) => {
                              const maxValue = Math.max(...userGrowthData.datasets[0].data);
                              const height = (value / maxValue) * 100;
                              return (
                                <div key={index} className="flex-1 mx-1 flex flex-col items-center">
                                  <div 
                                    className="w-full bg-indigo-100 rounded-t-md" 
                                    style={{ height: `${height}%` }}
                                  >
                                    <div 
                                      className="w-full bg-indigo-500 rounded-t-md"
                                      style={{ height: '8px' }}
                                    ></div>
                                  </div>
                                  <div className="text-xs text-gray-700 mt-2 font-medium">
                                    {value}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="bg-white rounded-xl shadow-md p-6 h-full">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Platform Stats</h2>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">Active Users</span>
                          <span className="font-medium">{Math.round((dashboardData.activeUsers / dashboardData.totalUsers) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-500 h-2.5 rounded-full" 
                            style={{ width: `${(dashboardData.activeUsers / dashboardData.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">Document Storage Used</span>
                          <span className="font-medium">68%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-indigo-500 h-2.5 rounded-full" 
                            style={{ width: '68%' }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">Server Load</span>
                          <span className="font-medium">42%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-500 h-2.5 rounded-full" 
                            style={{ width: '42%' }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">Premium Subscribers</span>
                          <span className="font-medium">35%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-purple-500 h-2.5 rounded-full" 
                            style={{ width: '35%' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
                    <Link
                      href="/admin/activity"
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {[
                      { 
                        action: 'New user registration', 
                        time: '2 minutes ago', 
                        details: 'John Smith (john.smith@example.com)' 
                      },
                      { 
                        action: 'Subscription upgraded', 
                        time: '15 minutes ago', 
                        details: 'Emma Davis upgraded to Professional Plan' 
                      },
                      { 
                        action: 'Document uploaded', 
                        time: '32 minutes ago', 
                        details: 'Contract_Agreement.pdf by Michael Brown' 
                      },
                      { 
                        action: 'Support ticket created', 
                        time: '1 hour ago', 
                        details: 'Ticket #4582: Payment issue' 
                      },
                      { 
                        action: 'New appointment booked', 
                        time: '3 hours ago', 
                        details: 'Legal consultation with Sarah Johnson' 
                      }
                    ].map((activity, index) => (
                      <div key={index} className="flex py-3 border-b border-gray-100 last:border-0">
                        <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 mr-3"></div>
                        <div>
                          <p className="font-medium text-gray-800">{activity.action}</p>
                          <div className="flex justify-between mt-1">
                            <p className="text-sm text-gray-500">{activity.details}</p>
                            <p className="text-xs text-gray-400 ml-4">{activity.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Attention Required</h2>
                    <Link
                      href="/admin/issues"
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-yellow-50 rounded-lg p-4 flex items-start">
                      <div className="p-2 rounded-md bg-yellow-100 text-yellow-600 mr-3">
                        <FaExclamationTriangle />
                      </div>
                      <div>
                        <h3 className="font-medium text-yellow-800">
                          Payment Processing Issues
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          3 failed payment attempts detected in the last 24 hours
                        </p>
                        <button className="text-sm text-indigo-600 font-medium mt-2">
                          Investigate
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4 flex items-start">
                      <div className="p-2 rounded-md bg-purple-100 text-purple-600 mr-3">
                        <FaCalendarCheck />
                      </div>
                      <div>
                        <h3 className="font-medium text-purple-800">
                          Pending Appointment Approvals
                        </h3>
                        <p className="text-sm text-purple-700 mt-1">
                          {dashboardData.pendingAppointments} appointments awaiting approval
                        </p>
                        <button className="text-sm text-indigo-600 font-medium mt-2">
                          Review Appointments
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4 flex items-start">
                      <div className="p-2 rounded-md bg-blue-100 text-blue-600 mr-3">
                        <FaFileAlt />
                      </div>
                      <div>
                        <h3 className="font-medium text-blue-800">
                          Document Review Queue
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">
                          12 documents need review by legal staff
                        </p>
                        <button className="text-sm text-indigo-600 font-medium mt-2">
                          Assign Reviewers
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-4 flex items-start">
                      <div className="p-2 rounded-md bg-red-100 text-red-600 mr-3">
                        <FaExclamationTriangle />
                      </div>
                      <div>
                        <h3 className="font-medium text-red-800">
                          System Alerts
                        </h3>
                        <p className="text-sm text-red-700 mt-1">
                          Database backup failed on April 15, 2024
                        </p>
                        <button className="text-sm text-indigo-600 font-medium mt-2">
                          Check System Status
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 