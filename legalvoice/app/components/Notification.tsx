'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

interface NotificationProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export default function Notification({
  type,
  message,
  duration = 5000,
  onClose,
  className = ''
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200'
  };

  const icons = {
    success: FaCheckCircle,
    error: FaExclamationCircle,
    info: FaInfoCircle,
    warning: FaExclamationCircle
  };

  const Icon = icons[type];

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full rounded-lg shadow-lg border p-4 ${typeStyles[type]} ${className}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            type="button"
            className="inline-flex text-current hover:opacity-75 focus:outline-none"
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
          >
            <span className="sr-only">Close</span>
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Notification context for managing multiple notifications
interface NotificationContextType {
  showNotification: (props: Omit<NotificationProps, 'onClose'>) => void;
}

export const NotificationContext = React.createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Array<{ id: string; props: NotificationProps }>>([]);

  const showNotification = (props: Omit<NotificationProps, 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, props }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-0 right-0 z-50 space-y-4 p-4">
        {notifications.map(({ id, props }) => (
          <Notification
            key={id}
            {...props}
            onClose={() => removeNotification(id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

// Hook for using notifications
export function useNotification() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
} 