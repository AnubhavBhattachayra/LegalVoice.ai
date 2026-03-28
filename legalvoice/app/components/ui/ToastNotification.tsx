'use client';

import React from 'react';
import { Toaster, toast as hotToast } from 'react-hot-toast';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  icon?: React.ReactNode;
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return hotToast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                {options?.icon || <FaCheckCircle className="h-5 w-5 text-green-500" />}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => hotToast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      ),
      { duration: options?.duration || 3000, position: options?.position || 'top-right' }
    );
  },
  
  error: (message: string, options?: ToastOptions) => {
    return hotToast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                {options?.icon || <FaExclamationCircle className="h-5 w-5 text-red-500" />}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => hotToast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      ),
      { duration: options?.duration || 4000, position: options?.position || 'top-right' }
    );
  },
  
  info: (message: string, options?: ToastOptions) => {
    return hotToast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                {options?.icon || <FaInfoCircle className="h-5 w-5 text-blue-500" />}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => hotToast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      ),
      { duration: options?.duration || 3000, position: options?.position || 'top-right' }
    );
  },
  
  warning: (message: string, options?: ToastOptions) => {
    return hotToast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                {options?.icon || <FaExclamationTriangle className="h-5 w-5 text-yellow-500" />}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => hotToast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      ),
      { duration: options?.duration || 4000, position: options?.position || 'top-right' }
    );
  },
  
  // Direct access to the underlying react-hot-toast functions
  dismiss: hotToast.dismiss,
  remove: hotToast.remove,
  promise: hotToast.promise,
  custom: hotToast.custom
};

export default function ToastNotification() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: '',
        style: {
          borderRadius: '8px',
          background: '#fff',
          color: '#333',
          boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05)',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10B981',
            secondary: 'white',
          },
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: '#EF4444',
            secondary: 'white',
          },
        },
      }}
    />
  );
} 