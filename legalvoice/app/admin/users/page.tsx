'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaUserPlus, 
  FaSearch, 
  FaEllipsisV, 
  FaLock, 
  FaEdit, 
  FaTrash, 
  FaEnvelope, 
  FaSortAmountDown, 
  FaSortAmountUp,
  FaFilter,
  FaUserShield,
  FaUserCheck,
  FaUserTimes,
  FaUserClock
} from 'react-icons/fa';
import { useAuth } from '@/app/lib/context/AuthContext';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import AdminNavigation from '@/app/components/AdminNavigation';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'legal_expert';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  createdAt: string;
  lastLogin: string | null;
  subscription?: {
    plan: string;
    status: 'active' | 'cancelled' | 'past_due';
  };
}

type SortField = 'name' | 'email' | 'role' | 'status' | 'createdAt' | 'lastLogin';
type SortDirection = 'asc' | 'desc';

export default function AdminUsers() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Sorting states
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (currentUser && !authLoading) {
      // Check if user is admin
      if (currentUser.role !== 'admin') {
        router.push('/unauthorized');
        return;
      }
      
      fetchUsers();
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    if (users.length > 0) {
      // Apply filters
      let result = [...users];
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        result = result.filter(
          user => 
            user.firstName.toLowerCase().includes(searchLower) ||
            user.lastName.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        );
      }
      
      if (roleFilter) {
        result = result.filter(user => user.role === roleFilter);
      }
      
      if (statusFilter) {
        result = result.filter(user => user.status === statusFilter);
      }
      
      // Apply sorting
      result.sort((a, b) => {
        if (sortField === 'name') {
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return sortDirection === 'asc' 
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        }
        
        if (sortField === 'email') {
          return sortDirection === 'asc'
            ? a.email.localeCompare(b.email)
            : b.email.localeCompare(a.email);
        }
        
        if (sortField === 'role') {
          return sortDirection === 'asc'
            ? a.role.localeCompare(b.role)
            : b.role.localeCompare(a.role);
        }
        
        if (sortField === 'status') {
          return sortDirection === 'asc'
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        }
        
        if (sortField === 'createdAt') {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        if (sortField === 'lastLogin') {
          const dateA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
          const dateB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        return 0;
      });
      
      setFilteredUsers(result);
    }
  }, [users, searchTerm, roleFilter, statusFilter, sortField, sortDirection]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // Using mock data for now
      setTimeout(() => {
        const mockUsers: User[] = [
          {
            _id: '1',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'user',
            status: 'active',
            createdAt: '2023-09-15T10:30:00Z',
            lastLogin: '2024-04-10T14:25:00Z',
            subscription: {
              plan: 'Professional',
              status: 'active'
            }
          },
          {
            _id: '2',
            email: 'alice.smith@example.com',
            firstName: 'Alice',
            lastName: 'Smith',
            role: 'admin',
            status: 'active',
            createdAt: '2023-08-20T09:15:00Z',
            lastLogin: '2024-04-15T11:45:00Z'
          },
          {
            _id: '3',
            email: 'robert.johnson@example.com',
            firstName: 'Robert',
            lastName: 'Johnson',
            role: 'legal_expert',
            status: 'active',
            createdAt: '2023-10-05T13:20:00Z',
            lastLogin: '2024-04-14T16:30:00Z'
          },
          {
            _id: '4',
            email: 'sarah.williams@example.com',
            firstName: 'Sarah',
            lastName: 'Williams',
            role: 'user',
            status: 'suspended',
            createdAt: '2023-11-12T11:40:00Z',
            lastLogin: '2024-03-25T10:15:00Z',
            subscription: {
              plan: 'Basic',
              status: 'past_due'
            }
          },
          {
            _id: '5',
            email: 'david.brown@example.com',
            firstName: 'David',
            lastName: 'Brown',
            role: 'user',
            status: 'inactive',
            createdAt: '2023-12-18T15:10:00Z',
            lastLogin: null
          },
          {
            _id: '6',
            email: 'emily.jones@example.com',
            firstName: 'Emily',
            lastName: 'Jones',
            role: 'user',
            status: 'active',
            createdAt: '2024-01-08T09:45:00Z',
            lastLogin: '2024-04-12T13:20:00Z',
            subscription: {
              plan: 'Enterprise',
              status: 'active'
            }
          },
          {
            _id: '7',
            email: 'michael.wilson@example.com',
            firstName: 'Michael',
            lastName: 'Wilson',
            role: 'legal_expert',
            status: 'active',
            createdAt: '2024-02-02T14:30:00Z',
            lastLogin: '2024-04-15T09:30:00Z'
          },
          {
            _id: '8',
            email: 'olivia.martinez@example.com',
            firstName: 'Olivia',
            lastName: 'Martinez',
            role: 'user',
            status: 'pending',
            createdAt: '2024-03-20T11:25:00Z',
            lastLogin: null
          }
        ];
        
        setUsers(mockUsers);
        setFilteredUsers(mockUsers);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching users:', error);
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsProcessing(true);
    try {
      // In a real app, this would be an API call
      // Simulating API call with timeout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state to remove the user
      setUsers(users.filter(u => u._id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setShowDeleteConfirm(null);
      setIsProcessing(false);
    }
  };

  const handleSendPasswordReset = async (userId: string, email: string) => {
    try {
      // In a real app, this would be an API call
      // Simulating API call with timeout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success(`Password reset email sent to ${email}`);
      setShowActionMenu(null);
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FaUserCheck className="text-green-500" />;
      case 'inactive':
        return <FaUserTimes className="text-gray-500" />;
      case 'pending':
        return <FaUserClock className="text-yellow-500" />;
      case 'suspended':
        return <FaLock className="text-red-500" />;
      default:
        return null;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <FaUserShield className="text-indigo-600" />;
      case 'legal_expert':
        return <FaUserShield className="text-blue-600" />;
      default:
        return null;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-indigo-100 text-indigo-800';
      case 'legal_expert':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    router.push('/unauthorized');
    return null;
  }

  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
              <p className="mt-1 text-gray-600">
                Manage users, permissions, and account status
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center"
                onClick={() => router.push('/admin/users/create')}
              >
                <FaUserPlus className="mr-2" />
                Add New User
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <AdminNavigation />
            </div>
            
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 w-full md:w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  </div>
                  
                  <div className="flex space-x-2">
                    <div className="relative">
                      <select
                        className="appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white"
                        value={roleFilter || ''}
                        onChange={(e) => setRoleFilter(e.target.value || null)}
                      >
                        <option value="">All Roles</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="legal_expert">Legal Expert</option>
                      </select>
                      <FaFilter className="absolute left-3 top-3 text-gray-400" />
                    </div>
                    
                    <div className="relative">
                      <select
                        className="appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white"
                        value={statusFilter || ''}
                        onChange={(e) => setStatusFilter(e.target.value || null)}
                      >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                      <FaFilter className="absolute left-3 top-3 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="py-32 flex justify-center">
                    <LoadingSpinner size="medium" text="Loading users..." />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th 
                              scope="col" 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                              onClick={() => handleSort('name')}
                            >
                              <div className="flex items-center">
                                Name
                                {sortField === 'name' && (
                                  sortDirection === 'asc' 
                                    ? <FaSortAmountUp className="ml-1" /> 
                                    : <FaSortAmountDown className="ml-1" />
                                )}
                              </div>
                            </th>
                            <th 
                              scope="col" 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                              onClick={() => handleSort('email')}
                            >
                              <div className="flex items-center">
                                Email
                                {sortField === 'email' && (
                                  sortDirection === 'asc' 
                                    ? <FaSortAmountUp className="ml-1" /> 
                                    : <FaSortAmountDown className="ml-1" />
                                )}
                              </div>
                            </th>
                            <th 
                              scope="col" 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                              onClick={() => handleSort('role')}
                            >
                              <div className="flex items-center">
                                Role
                                {sortField === 'role' && (
                                  sortDirection === 'asc' 
                                    ? <FaSortAmountUp className="ml-1" /> 
                                    : <FaSortAmountDown className="ml-1" />
                                )}
                              </div>
                            </th>
                            <th 
                              scope="col" 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                              onClick={() => handleSort('status')}
                            >
                              <div className="flex items-center">
                                Status
                                {sortField === 'status' && (
                                  sortDirection === 'asc' 
                                    ? <FaSortAmountUp className="ml-1" /> 
                                    : <FaSortAmountDown className="ml-1" />
                                )}
                              </div>
                            </th>
                            <th 
                              scope="col" 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                              onClick={() => handleSort('createdAt')}
                            >
                              <div className="flex items-center">
                                Joined
                                {sortField === 'createdAt' && (
                                  sortDirection === 'asc' 
                                    ? <FaSortAmountUp className="ml-1" /> 
                                    : <FaSortAmountDown className="ml-1" />
                                )}
                              </div>
                            </th>
                            <th 
                              scope="col" 
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                              <tr key={user._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-medium uppercase">
                                      {user.firstName[0]}{user.lastName[0]}
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900 flex items-center">
                                        {user.firstName} {user.lastName}
                                        {getRoleIcon(user.role)}
                                      </div>
                                      {user.subscription && (
                                        <div className="text-xs text-gray-500">
                                          {user.subscription.plan} Plan • 
                                          <span className={user.subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                                            {user.subscription.status}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{user.email}</div>
                                  <div className="text-xs text-gray-500">
                                    Last login: {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                                    {user.role === 'legal_expert' ? 'Legal Expert' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(user.status)}`}>
                                    <span className="flex items-center">
                                      {getStatusIcon(user.status)}
                                      <span className="ml-1">{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
                                    </span>
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(user.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="relative">
                                    <button
                                      onClick={() => setShowActionMenu(showActionMenu === user._id ? null : user._id)}
                                      className="text-gray-600 hover:text-gray-900"
                                    >
                                      <FaEllipsisV />
                                    </button>
                                    
                                    {showActionMenu === user._id && (
                                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                                        <button
                                          onClick={() => router.push(`/admin/users/edit/${user._id}`)}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                        >
                                          <FaEdit className="mr-2" /> Edit User
                                        </button>
                                        <button
                                          onClick={() => handleSendPasswordReset(user._id, user.email)}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                        >
                                          <FaEnvelope className="mr-2" /> Send Password Reset
                                        </button>
                                        <button
                                          onClick={() => setShowDeleteConfirm(user._id)}
                                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                        >
                                          <FaTrash className="mr-2" /> Delete User
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                {searchTerm || roleFilter || statusFilter ? (
                                  <div>
                                    <p className="font-medium">No users found matching your search criteria</p>
                                    <button
                                      className="mt-2 text-indigo-600 hover:text-indigo-800"
                                      onClick={() => {
                                        setSearchTerm('');
                                        setRoleFilter(null);
                                        setStatusFilter(null);
                                      }}
                                    >
                                      Clear all filters
                                    </button>
                                  </div>
                                ) : (
                                  <p>No users found</p>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-6 border-t border-gray-200 pt-4 text-sm text-gray-500">
                      Showing {filteredUsers.length} of {users.length} users
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-[0.5] flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner size="small" className="mr-2" /> Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash className="mr-2" /> Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 