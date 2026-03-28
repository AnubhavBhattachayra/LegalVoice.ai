'use client';

import React, { Fragment, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaTimes } from 'react-icons/fa';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  initialFocus?: React.MutableRefObject<HTMLElement | null>;
  footer?: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  initialFocus,
  footer
}: ModalProps) {
  // Create a ref for the cancel button
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  
  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (closeOnEsc && isOpen && event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [closeOnEsc, isOpen, onClose]);
  
  // Get the max width based on size
  const getMaxWidth = () => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case 'full':
        return 'max-w-full mx-4';
      default:
        return 'max-w-md';
    }
  };
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="fixed inset-0 z-50 overflow-y-auto" 
        onClose={closeOnOverlayClick ? onClose : () => {}}
        initialFocus={initialFocus || cancelButtonRef}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-[0.5] transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className={`inline-block w-full ${getMaxWidth()} p-6 my-8 overflow-hidden text-left align-middle bg-white rounded-lg shadow-xl transition-all`}>
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between mb-4">
                  {title && (
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      {title}
                    </Dialog.Title>
                  )}
                  
                  {showCloseButton && (
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={onClose}
                      ref={cancelButtonRef}
                    >
                      <span className="sr-only">Close</span>
                      <FaTimes />
                    </button>
                  )}
                </div>
              )}
              
              {/* Content */}
              <div className="mt-2">
                {children}
              </div>
              
              {/* Footer */}
              {footer && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  {footer}
                </div>
              )}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
} 