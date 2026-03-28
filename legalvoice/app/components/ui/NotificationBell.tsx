'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaCheck, FaCheckDouble, FaTrash, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '@/app/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  link?: string;
  data?: any;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    
    fetchNotifications();
    
    // Set up polling for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications?limit=5', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    
    try {
      setIsMarkingAll(true);
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }
      
      // Update local state
      setNotifications(notifications.map(notification => ({
        ...notification,
        read: true
      })));
      setUnreadCount(0);
      
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [id] }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update local state
      setNotifications(notifications.map(notification => 
        notification._id === id ? { ...notification, read: true } : notification
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
      
      // Update local state
      const deletedNotification = notifications.find(n => n._id === id);
      setNotifications(notifications.filter(n => n._id !== id));
      
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    
    // Navigate if there's a link
    if (notification.link) {
      router.push(notification.link);
    }
    
    // Close the dropdown
    setIsOpen(false);
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <FaCheck className="text-green-500" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'error':
        return <FaExclamationCircle className="text-red-500" />;
      case 'info':
      default:
        return <FaInfoCircle className="text-blue-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="relative" ref={notificationRef}>
      <button
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <FaBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
              {notifications.length > 0 && unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  disabled={isMarkingAll}
                >
                  {isMarkingAll ? (
                    <LoadingSpinner size="small" className="mr-1" />
                  ) : (
                    <FaCheckDouble className="mr-1" />
                  )}
                  Mark all as read
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="py-8 flex justify-center">
                <LoadingSpinner size="medium" />
              </div>
            ) : notifications.length > 0 ? (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div 
                        className="ml-3 flex-1 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatTime(notification.createdAt)}</p>
                      </div>
                      <div className="flex-shrink-0 ml-2 flex flex-col space-y-2 mt-1">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Mark as read"
                          >
                            <FaCheck className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete notification"
                        >
                          <FaTrash className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500 text-sm">No notifications</p>
              </div>
            )}
          </div>
          
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <Link
              href="/notifications"
              className="block text-center text-xs text-blue-600 hover:text-blue-800"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 