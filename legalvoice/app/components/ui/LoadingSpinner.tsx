import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  fullPage?: boolean;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  fullPage = false,
  text
}) => {
  // Size mapping
  const sizeMap = {
    small: 'w-5 h-5',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  // Color mapping
  const colorMap = {
    primary: 'text-blue-600',
    secondary: 'text-purple-600',
    white: 'text-white'
  };

  // SVG spinner
  const spinner = (
    <svg
      className={`animate-spin ${sizeMap[size]} ${colorMap[color]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      data-testid="loading-spinner"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-50 bg-opacity-[0.75] z-50">
        {spinner}
        {text && <p className="mt-4 text-gray-700 font-medium">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {spinner}
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
};

export default LoadingSpinner; 