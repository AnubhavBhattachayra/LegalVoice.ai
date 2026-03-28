'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaFile, FaFileAlt, FaFilePdf, FaClock, FaTrash, FaPencilAlt, FaKey, FaSignOutAlt, FaShieldAlt, FaCreditCard } from 'react-icons/fa';
import { useAuthContext } from '../features/auth/AuthContext';
import { usePayment } from '../lib/context/PaymentContext';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const { user, logout, loading: authLoading } = useAuthContext();
  const { subscription, subscriptionPlans, isLoadingSubscription } = usePayment();
  const [activeTab, setActiveTab] = useState('documents');
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      // Fetch user documents and activity (mock data for now)
      fetchUserData();
    }
  }, [user, authLoading, router]);

  const fetchUserData = async () => {
    setIsLoading(true);
    // In a real implementation, this would be an API call
    // Mock data for now
    setTimeout(() => {
      setSavedDocuments([
        {
          id: 1,
          title: 'Rent Agreement',
          type: 'pdf',
          date: '15 Mar 2023',
          size: '256 KB',
        },
        {
          id: 2,
          title: 'Power of Attorney',
          type: 'doc',
          date: '28 Apr 2023',
          size: '128 KB',
        },
        {
          id: 3,
          title: 'Affidavit for Name Change',
          type: 'pdf',
          date: '10 Jun 2023',
          size: '320 KB',
        },
        {
          id: 4,
          title: 'Income Declaration',
          type: 'doc',
          date: '05 Jul 2023',
          size: '98 KB',
        }
      ]);
      
      setRecentActivity([
        {
          id: 1,
          action: 'Created document',
          document: 'Traffic Challan Response',
          date: '2 days ago'
        },
        {
          id: 2,
          action: 'Contacted lawyer',
          document: 'Adv. Priya Sharma',
          date: '5 days ago'
        },
        {
          id: 3,
          action: 'Analyzed document with OCR',
          document: 'Court Notice',
          date: '1 week ago'
        }
      ]);
      
      setIsLoading(false);
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  // File icon based on document type
  const getFileIcon = (type: string) => {
    switch(type) {
      case 'pdf':
        return <FaFilePdf className="text-red-500" />;
      case 'doc':
        return <FaFileAlt className="text-blue-500" />;
      default:
        return <FaFile className="text-gray-500" />;
    }
  };

  // Handle document deletion
  const handleDeleteDocument = (docId: number) => {
    // In a real app, this would call an API
    setSavedDocuments(prev => prev.filter(doc => doc.id !== docId));
    toast.success('Document deleted successfully');
  };

  // Get current subscription plan name
  const getCurrentPlanName = () => {
    if (isLoadingSubscription || !subscription) return 'Free';
    const plan = subscriptionPlans.find(p => p._id === subscription.planId);
    return plan ? plan.name : 'Free';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Profile Sidebar */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Profile Header */}
              <div className="bg-indigo-600 px-6 py-8 text-center">
                <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <FaUser className="text-indigo-600 text-4xl" />
                  )}
                </div>
                <h2 className="mt-4 text-2xl font-bold text-white">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-indigo-200">
                  {getCurrentPlanName()} Plan
                </p>
              </div>
              
              {/* Contact Information */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <FaEnvelope className="mr-3 text-indigo-500" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaPhone className="mr-3 text-indigo-500" />
                    <span>{user.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-start text-gray-600">
                    <FaMapMarkerAlt className="mr-3 mt-1 text-indigo-500" />
                    <span>{user.address || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaCreditCard className="mr-3 text-indigo-500" />
                    <Link href="/payments/settings" className="text-indigo-600 hover:underline">
                      Manage Payment Methods
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Account Options */}
              <div className="p-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Options</h3>
                <div className="space-y-3">
                  <Link 
                    href="/profile/edit" 
                    className="flex items-center text-gray-600 hover:text-indigo-600 transition"
                  >
                    <FaPencilAlt className="mr-3 text-indigo-500" />
                    <span>Edit Profile</span>
                  </Link>
                  <Link 
                    href="/profile/password" 
                    className="flex items-center text-gray-600 hover:text-indigo-600 transition"
                  >
                    <FaKey className="mr-3 text-indigo-500" />
                    <span>Change Password</span>
                  </Link>
                  <Link 
                    href="/profile/privacy" 
                    className="flex items-center text-gray-600 hover:text-indigo-600 transition"
                  >
                    <FaShieldAlt className="mr-3 text-indigo-500" />
                    <span>Privacy Settings</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center text-gray-600 hover:text-red-600 transition w-full text-left"
                  >
                    <FaSignOutAlt className="mr-3 text-indigo-500" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:w-2/3">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="flex border-b border-gray-200">
                <button 
                  onClick={() => setActiveTab('documents')}
                  className={`flex-1 py-4 px-6 text-center font-medium ${
                    activeTab === 'documents' 
                      ? 'text-indigo-600 border-b-2 border-indigo-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Saved Documents
                </button>
                <button 
                  onClick={() => setActiveTab('activity')}
                  className={`flex-1 py-4 px-6 text-center font-medium ${
                    activeTab === 'activity' 
                      ? 'text-indigo-600 border-b-2 border-indigo-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Recent Activity
                </button>
                <button 
                  onClick={() => setActiveTab('subscription')}
                  className={`flex-1 py-4 px-6 text-center font-medium ${
                    activeTab === 'subscription' 
                      ? 'text-indigo-600 border-b-2 border-indigo-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Subscription
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="bg-white rounded-xl shadow-md p-8 flex justify-center">
                <LoadingSpinner size="medium" />
              </div>
            ) : (
              <>
                {/* Saved Documents Tab */}
                {activeTab === 'documents' && (
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800">Your Documents</h2>
                        <Link 
                          href="/documents/create" 
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                          Create New Document
                        </Link>
                      </div>
                      
                      {savedDocuments.length > 0 ? (
                        <div className="space-y-4">
                          {savedDocuments.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                              <div className="flex items-center">
                                <div className="p-3 bg-gray-100 rounded-lg mr-4">
                                  {getFileIcon(doc.type)}
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-800">{doc.title}</h3>
                                  <div className="flex space-x-4 text-sm text-gray-500">
                                    <span className="flex items-center">
                                      <FaClock className="mr-1" /> {doc.date}
                                    </span>
                                    <span>{doc.size}</span>
                                    <span className="uppercase">{doc.type}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Link href={`/documents/view/${doc.id}`} className="p-2 text-indigo-600 hover:text-indigo-800 transition">
                                  <FaFileAlt title="View" />
                                </Link>
                                <button 
                                  onClick={() => handleDeleteDocument(doc.id)} 
                                  className="p-2 text-red-600 hover:text-red-800 transition"
                                >
                                  <FaTrash title="Delete" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FaFile className="mx-auto text-gray-300 text-5xl mb-4" />
                          <h3 className="text-xl font-medium text-gray-800 mb-2">No Documents Yet</h3>
                          <p className="text-gray-600 mb-6">You haven't created or saved any documents yet.</p>
                          <Link 
                            href="/documents/create" 
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                          >
                            Create Your First Document
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Recent Activity Tab */}
                {activeTab === 'activity' && (
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Recent Activity</h2>
                      
                      {recentActivity.length > 0 ? (
                        <div className="space-y-4">
                          {recentActivity.map(activity => (
                            <div key={activity.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium text-gray-800">{activity.action}</h3>
                                  <p className="text-indigo-600">{activity.document}</p>
                                </div>
                                <div className="text-gray-500 text-sm">{activity.date}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FaClock className="mx-auto text-gray-300 text-5xl mb-4" />
                          <h3 className="text-xl font-medium text-gray-800 mb-2">No Recent Activity</h3>
                          <p className="text-gray-600">Start using LegalVoice AI to see your activity here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Subscription Tab */}
                {activeTab === 'subscription' && (
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Subscription</h2>
                      
                      {isLoadingSubscription ? (
                        <div className="flex justify-center py-8">
                          <LoadingSpinner size="medium" />
                        </div>
                      ) : subscription ? (
                        <div>
                          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 mb-6">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-xl font-semibold text-indigo-800">
                                {getCurrentPlanName()} Plan
                              </h3>
                              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                                {subscription.status}
                              </span>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 text-gray-700">
                              <div>
                                <p className="text-sm text-gray-500">Next billing date</p>
                                <p className="font-medium">
                                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                </p>
                              </div>
                              {subscription.cancelAtPeriodEnd && (
                                <div>
                                  <p className="text-sm text-orange-600 font-medium">
                                    Your subscription will end on the next billing date
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="mt-6 flex space-x-4">
                              <Link 
                                href="/billing/plans" 
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                              >
                                Change Plan
                              </Link>
                              {!subscription.cancelAtPeriodEnd && (
                                <Link 
                                  href="/billing/cancel" 
                                  className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition"
                                >
                                  Cancel Subscription
                                </Link>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800 mb-2">Plan Features:</h4>
                            <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4">
                              {subscriptionPlans.find(p => p._id === subscription.planId)?.features.map((feature, index) => (
                                <li key={index}>{feature}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FaCreditCard className="mx-auto text-gray-300 text-5xl mb-4" />
                          <h3 className="text-xl font-medium text-gray-800 mb-2">No Active Subscription</h3>
                          <p className="text-gray-600 mb-6">Upgrade to access premium features and support.</p>
                          <Link 
                            href="/billing/plans" 
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                          >
                            View Plans
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 