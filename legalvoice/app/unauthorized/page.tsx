'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaExclamationTriangle, FaArrowLeft, FaHome } from 'react-icons/fa';

export default function Unauthorized() {
  const router = useRouter();

  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden p-8">
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-red-100 rounded-full mb-4">
            <FaExclamationTriangle className="text-red-600 text-3xl" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Unauthorized Access</h1>
          
          <p className="text-gray-600 mb-8">
            You do not have permission to access this page. Please contact an administrator if you believe this is an error.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center px-5 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FaArrowLeft className="mr-2" /> Go Back
            </button>
            
            <Link 
              href="/"
              className="inline-flex items-center justify-center px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <FaHome className="mr-2" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 