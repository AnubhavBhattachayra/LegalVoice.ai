'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { FaChevronLeft, FaFileAlt, FaFileContract, FaGavel, FaFileInvoiceDollar, FaHotel, FaCar, FaHome, FaBalanceScale, FaRegBuilding, FaHandshake, FaScroll } from 'react-icons/fa';

// Dynamically import the AIDraftingChat component to prevent server/client hydration issues
const AIDraftingChat = dynamic(
  () => import('@/app/components/AIDraftingChat'),
  { ssr: false }
);

interface DocumentTypeOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  complexity: 'standard' | 'complex';
  promptSuggestion: string;
}

const documentTypes: DocumentTypeOption[] = [
  {
    id: 'affidavit',
    title: 'Affidavit',
    description: 'A written statement confirmed by oath or affirmation for use as evidence in court',
    icon: <FaGavel className="text-blue-600 h-8 w-8" />,
    complexity: 'standard',
    promptSuggestion: 'I need to create an affidavit for a legal proceeding.'
  },
  {
    id: 'poa',
    title: 'Power of Attorney',
    description: 'Legal authorization for someone to act on your behalf',
    icon: <FaBalanceScale className="text-blue-600 h-8 w-8" />,
    complexity: 'standard',
    promptSuggestion: 'I need to create a power of attorney document.'
  },
  {
    id: 'rent',
    title: 'Rent Agreement',
    description: 'Contract between landlord and tenant for property rental',
    icon: <FaHotel className="text-blue-600 h-8 w-8" />,
    complexity: 'standard',
    promptSuggestion: 'I want to create a rental agreement for my property.'
  },
  {
    id: 'vehicle-registration',
    title: 'Vehicle Registration',
    description: 'Documentation for registering vehicles with the authorities',
    icon: <FaCar className="text-blue-600 h-8 w-8" />,
    complexity: 'standard',
    promptSuggestion: 'I need to prepare documents for vehicle registration.'
  },
  {
    id: 'property-sale',
    title: 'Property Sale Agreement',
    description: 'Contract for the transfer of property ownership',
    icon: <FaHome className="text-blue-600 h-8 w-8" />,
    complexity: 'standard',
    promptSuggestion: 'I want to create a property sale agreement.'
  },
  {
    id: 'patent-application',
    title: 'Patent Application',
    description: 'Documentation to request patent protection for an invention',
    icon: <FaRegBuilding className="text-blue-600 h-8 w-8" />,
    complexity: 'complex',
    promptSuggestion: 'I need assistance with drafting a patent application for my new invention. The invention is related to [brief description of your invention] and I need help with the title, background, description of the invention, claims, and other required sections.'
  },
  {
    id: 'will',
    title: 'Will',
    description: "Legal document expressing a person's wishes regarding the distribution of their property after death",
    icon: <FaScroll className="text-blue-600 h-8 w-8" />,
    complexity: 'complex',
    promptSuggestion: 'I need help creating a will for my assets.'
  },
  {
    id: 'partnership-deed',
    title: 'Partnership Deed',
    description: 'Legal document outlining the terms and conditions of a partnership business',
    icon: <FaHandshake className="text-blue-600 h-8 w-8" />,
    complexity: 'complex',
    promptSuggestion: 'I want to draft a partnership deed for my new business venture.'
  },
  {
    id: 'legal-notice',
    title: 'Legal Notice',
    description: 'Formal communication notifying the recipient of a legal issue or action',
    icon: <FaFileContract className="text-blue-600 h-8 w-8" />,
    complexity: 'complex',
    promptSuggestion: 'I need to send a legal notice regarding a dispute.'
  },
  {
    id: 'other',
    title: 'Other Document',
    description: 'Create a custom legal document based on your specific needs',
    icon: <FaFileAlt className="text-blue-600 h-8 w-8" />,
    complexity: 'complex',
    promptSuggestion: 'I need help creating a specific legal document.'
  }
];

export default function AIDraftingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedType, setSelectedType] = useState<string | null>(searchParams.get('type'));
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(searchParams.get('session_id'));

  // If a prompt was provided in the URL, initialize it
  useEffect(() => {
    const urlPrompt = searchParams.get('prompt');
    if (urlPrompt) {
      setUserPrompt(decodeURIComponent(urlPrompt));
    }
  }, [searchParams]);

  // If sessionId is provided, render the chat directly
  if (sessionId) {
    return (
      <div className="min-h-screen bg-[#07081a] flex flex-col">
        <div className="container mx-auto p-4 flex-1 flex flex-col">
          <div className="mb-4 mt-10">
            <Link href="/documents/draft" className="flex items-center text-[#a78bfa] hover:text-[#8b5cf6]">
              <FaChevronLeft className="mr-2" /> Back to Document Types
            </Link>
          </div>
          <div className="flex-grow rounded-lg shadow overflow-hidden mt-4">
            <AIDraftingChat sessionId={sessionId === 'new' ? undefined : sessionId} 
                             documentType={selectedType || undefined}
                             initialMessage={userPrompt} />
          </div>
        </div>
      </div>
    );
  }

  // If document type is selected, show the prompt interface
  if (selectedType) {
    const selectedTypeInfo = documentTypes.find(type => type.id === selectedType);
    
    const startDrafting = () => {
      if (!userPrompt.trim()) {
        setError('Please provide some details about what you need');
        return;
      }
      
      setIsStarting(true);
      
      // In a real implementation, you would create a session via API and then navigate
      // For demo purposes, we'll just navigate with query params
      router.push(`/documents/draft?type=${selectedType}&session_id=new&prompt=${encodeURIComponent(userPrompt)}`);
    };
    
    return (
      <div className="min-h-screen bg-[#07081a] p-4">
        <div className="container mx-auto">
          <div className="mb-4">
            <button 
              onClick={() => setSelectedType(null)} 
              className="flex items-center text-[#a78bfa] hover:text-[#8b5cf6]"
            >
              <FaChevronLeft className="mr-2" /> Back to Document Types
            </button>
          </div>
          
          <div className="bg-[#0d0f29] rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="bg-[#181c42] p-3 rounded-lg">
                {selectedTypeInfo?.icon}
              </div>
              <h1 className="text-2xl font-bold ml-3 text-white">
                {selectedTypeInfo?.title || 'Create Document'}
              </h1>
            </div>
            
            <p className="text-gray-300 mb-6">{selectedTypeInfo?.description}</p>
            
            <div className="mb-4">
              <label className="block text-white font-medium mb-2">
                Describe what you need:
              </label>
              <textarea
                className="w-full p-3 bg-[#181c42] border border-[#242966] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
                rows={5}
                placeholder={selectedTypeInfo?.promptSuggestion || "Tell us what you need help with..."}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
              />
              {error && <p className="text-red-400 mt-2">{error}</p>}
            </div>
            
            {selectedTypeInfo?.complexity === 'complex' && (
              <div className="bg-[#1e0b35]/30 border-l-4 border-[#a78bfa] p-4 mb-4">
                <p className="text-[#a78bfa]">
                  This is a complex document type that may require more credits to generate.
                </p>
              </div>
            )}
            
            <button
              onClick={startDrafting}
              disabled={isStarting}
              className="bg-[#a78bfa] hover:bg-[#8b5cf6] text-white py-2 px-6 rounded-lg shadow flex items-center"
            >
              {isStarting ? (
                <>Starting...</>
              ) : (
                <>
                  <FaFileAlt className="mr-2" />
                  Start Drafting
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Document type selection interface
  return (
    <div className="min-h-screen bg-[#07081a] p-4">
      <div className="container mx-auto">
        <div className="bg-[#0d0f29] rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2 text-white">Create a Document with AI</h1>
          
          <p className="text-gray-300 mb-8">
            Select the type of document you want to create. Our AI will guide you through the process with
            a natural conversation to gather all necessary information.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className="bg-[#181c42] border border-[#242966] rounded-lg p-4 hover:border-[#a78bfa] hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex items-center mb-2">
                  {type.icon}
                  <h3 className="font-semibold ml-2 text-white">{type.title}</h3>
                </div>
                <p className="text-gray-300 text-sm">{type.description}</p>
                {type.complexity === 'complex' && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-[#a78bfa]/20 text-[#a78bfa] rounded">
                    Complex Document
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 