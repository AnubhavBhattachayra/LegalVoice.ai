'use client';

import { useState, useEffect } from 'react';
import { FaFileAlt, FaUserTie, FaRobot, FaHistory, FaCreditCard, FaBell } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

interface DashboardStats {
  totalDocuments: number;
  pendingConsultations: number;
  availableCredits: number;
  recentActivities: Array<{
    id: string;
    type: 'document' | 'consultation' | 'chat';
    title: string;
    date: string;
    status: 'completed' | 'pending' | 'in_progress';
  }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    pendingConsultations: 0,
    availableCredits: 0,
    recentActivities: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.email}
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your legal documents and consultations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalDocuments}
              </p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-full">
              <FaFileAlt className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Consultations</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.pendingConsultations}
              </p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-full">
              <FaUserTie className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Credits</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.availableCredits}
              </p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-full">
              <FaCreditCard className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <FaFileAlt className="w-6 h-6 text-indigo-600 mb-2" />
            <span className="text-sm text-gray-600">New Document</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <FaUserTie className="w-6 h-6 text-indigo-600 mb-2" />
            <span className="text-sm text-gray-600">Book Consultation</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <FaRobot className="w-6 h-6 text-indigo-600 mb-2" />
            <span className="text-sm text-gray-600">AI Assistant</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <FaBell className="w-6 h-6 text-indigo-600 mb-2" />
            <span className="text-sm text-gray-600">Notifications</span>
          </button>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
        <div className="space-y-4">
          {stats.recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-50 p-2 rounded-full">
                  {activity.type === 'document' && <FaFileAlt className="w-5 h-5 text-indigo-600" />}
                  {activity.type === 'consultation' && <FaUserTie className="w-5 h-5 text-indigo-600" />}
                  {activity.type === 'chat' && <FaRobot className="w-5 h-5 text-indigo-600" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.date}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  activity.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : activity.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 