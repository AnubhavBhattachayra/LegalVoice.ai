'use client';

import { FaSpinner } from 'react-icons/fa';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  text?: string;
  className?: string;
}

export default function Loading({
  size = 'medium',
  fullScreen = false,
  text,
  className = ''
}: LoadingProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const spinner = (
    <div className={`flex items-center justify-center ${className}`}>
      <FaSpinner className={`animate-spin text-indigo-600 ${sizeClasses[size]}`} />
      {text && <span className="ml-2 text-gray-600">{text}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-[0.75] flex items-center justify-center z-50">
        <div className="text-center">
          {spinner}
          {text && <p className="mt-4 text-gray-600">{text}</p>}
        </div>
      </div>
    );
  }

  return spinner;
} 