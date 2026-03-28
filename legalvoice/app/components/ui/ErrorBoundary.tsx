import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Here you could log the error to an error reporting service
    // For example, using Sentry
    // import * as Sentry from '@sentry/nextjs';
    // Sentry.captureException(error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-white p-5 text-gray-800">
          <div className="text-5xl font-bold text-red-500 mb-8">Something went wrong</div>
          <div className="text-xl mb-8">
            We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.
          </div>
          <div className="bg-gray-100 p-4 rounded-lg w-full max-w-2xl overflow-auto mb-8">
            <p className="font-mono text-sm text-gray-700 whitespace-pre-wrap">
              {this.state.error?.toString()}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 