'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaDownload, FaShare, FaPrint, FaEdit, FaTrash, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import { useAuth } from '@/app/lib/context/AuthContext';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { toast } from 'react-hot-toast';

// Mock document types for demonstration
interface DocumentFile {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  fileSize: string;
  tags: string[];
  status: 'draft' | 'completed';
}

export default function DocumentView({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [document, setDocument] = useState<DocumentFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchDocument(params.id);
  }, [params.id, user, router]);

  const fetchDocument = async (id: string) => {
    setIsLoading(true);
    
    try {
      // Mock API call for demonstration
      // In a real app, this would be an API call to fetch the document
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      if (id === '1') {
        setDocument({
          id: '1',
          title: 'Rent Agreement',
          content: `# RENT AGREEMENT\n\nTHIS RENT AGREEMENT is made on this 10th day of March, 2023 between Mr. Landlord, s/o Late Shri Father's Name, r/o Full Address (hereinafter called the "LESSOR") of the ONE PART and Mr. Tenant, s/o Shri Father's Name, r/o Full Address (hereinafter called the "LESSEE") of the OTHER PART.\n\nWHEREAS the Lessor is the absolute owner of the property No. Property Address.\n\nAND WHEREAS the Lessee has approached the Lessor for the tenancy of Ground Floor of the aforesaid property, for a period of 11 months and the Lessor has agreed to grant the same on the following terms and conditions:\n\n1. That the tenancy shall be for a period of 11 months commencing from 15th March, 2023 and ending on 14th February, 2024.\n\n2. That the monthly rent for the demised premises shall be Rs. 20,000/- (Rupees Twenty Thousand Only) inclusive of water charges which the Lessee undertakes to pay regularly by the 7th day of each English Calendar month for which the rent is due.\n\n3. That the Lessee has paid a sum of Rs. 60,000/- (Rupees Sixty Thousand Only) as security deposit, which will be refunded at the time of vacating the premises after deducting any dues/damages if any.`,
          type: 'doc',
          createdAt: '2023-03-10T08:30:00.000Z',
          updatedAt: '2023-03-12T14:22:00.000Z',
          fileSize: '256 KB',
          tags: ['Rental', 'Agreement', 'Property'],
          status: 'completed'
        });
      } else if (id === '2') {
        setDocument({
          id: '2',
          title: 'Power of Attorney',
          content: `# POWER OF ATTORNEY\n\nKNOW ALL MEN BY THESE PRESENTS THAT I, [Name], s/o [Father's Name], r/o [Address], do hereby appoint, nominate and constitute [Attorney Name], s/o [Attorney's Father's Name], r/o [Attorney's Address] as my true and lawful Attorney to act for and on my behalf to do all or any of the following acts, deeds and things in respect of my property:\n\n1. To represent me before any Government office, Municipal Corporation, Sub-Registrar Office, Development Authority or any other concerned authority in connection with the said property.\n\n2. To execute, sign, verify and present any application, affidavit, indemnity bond, undertaking or any other document in connection with the said property.`,
          type: 'pdf',
          createdAt: '2023-04-25T10:15:00.000Z',
          updatedAt: '2023-04-28T09:05:00.000Z',
          fileSize: '128 KB',
          tags: ['Legal', 'Power of Attorney'],
          status: 'completed'
        });
      } else if (id === '3') {
        setDocument({
          id: '3',
          title: 'Affidavit for Name Change',
          content: `# AFFIDAVIT FOR NAME CHANGE\n\nI, [Old Name], s/o [Father's Name], r/o [Full Address], aged about [Age] years, do hereby solemnly affirm and declare as under:\n\n1. That I was born on [Date of Birth] at [Place of Birth].\n\n2. That my name has been recorded as [Old Name] in my educational documents and other records.\n\n3. That I have decided to change my name from [Old Name] to [New Name] for all purposes and intents.\n\n4. That I hereby declare that [Old Name] and [New Name] is one and the same person and I undertake to be known and addressed by my new name [New Name] for all future purposes.`,
          type: 'pdf',
          createdAt: '2023-06-10T15:45:00.000Z',
          updatedAt: '2023-06-10T16:20:00.000Z',
          fileSize: '320 KB',
          tags: ['Affidavit', 'Name Change'],
          status: 'completed'
        });
      } else if (id === '4') {
        setDocument({
          id: '4',
          title: 'Income Declaration',
          content: `# INCOME DECLARATION\n\nI, [Name], s/o [Father's Name], r/o [Address], do hereby solemnly declare as follows:\n\n1. That I am working as a [Occupation] at [Company/Organization Name] since [Date].\n\n2. That my annual income from all sources for the financial year [Year-Year] is Rs. [Amount in Figures]/- (Rupees [Amount in Words] Only).\n\n3. That I am filing this declaration for the purpose of [Purpose].\n\n4. That the facts stated above are true and correct to the best of my knowledge and belief.`,
          type: 'doc',
          createdAt: '2023-07-05T12:30:00.000Z',
          updatedAt: '2023-07-05T14:10:00.000Z',
          fileSize: '98 KB',
          tags: ['Income', 'Declaration', 'Financial'],
          status: 'completed'
        });
      } else {
        setError('Document not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!document) return;
    
    // In a real app, this would trigger a file download
    // For demo purposes, we'll just show a toast
    toast.success(`Downloading "${document.title}"`);
  };

  const handlePrint = () => {
    if (!document) return;
    
    // In a real app, this would open a print dialog
    window.print();
  };

  const handleShare = () => {
    if (!document) return;
    
    // Check if Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: document.title,
        text: `Check out my document: ${document.title}`,
        url: window.location.href
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast.success('Link copied to clipboard');
      });
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    
    if (confirm('Are you sure you want to delete this document?')) {
      setIsDeleting(true);
      
      try {
        // Mock API call for demonstration
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success('Document deleted successfully');
        router.push('/profile'); // Redirect to profile page
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete document');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading document..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
          <Link href="/profile" className="mt-4 inline-block text-blue-600 hover:underline">
            Return to Profile
          </Link>
        </div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/profile" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
            <FaArrowLeft className="mr-2" /> Back to Profile
          </Link>
        </div>
        
        {/* Document Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{document.title}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {document.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-sm text-gray-500">
                <p>Created: {new Date(document.createdAt).toLocaleDateString()}</p>
                <p>Last modified: {new Date(document.updatedAt).toLocaleDateString()}</p>
                <p>Size: {document.fileSize}</p>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <button 
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FaDownload className="mr-2" /> Download
              </button>
              <button 
                onClick={handlePrint}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FaPrint className="mr-2" /> Print
              </button>
              <button 
                onClick={handleShare}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FaShare className="mr-2" /> Share
              </button>
            </div>
          </div>
        </div>
        
        {/* Document Content */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="prose prose-indigo max-w-none">
              {document.content.split('\n').map((line, index) => {
                // Handle headers
                if (line.startsWith('# ')) {
                  return <h1 key={index} className="text-2xl font-bold my-4">{line.substring(2)}</h1>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={index} className="text-xl font-bold my-3">{line.substring(3)}</h2>;
                }
                // Handle lists
                if (line.match(/^\d+\./)) {
                  return <p key={index} className="ml-5 my-2">{line}</p>;
                }
                // Handle empty lines
                if (line.trim() === '') {
                  return <br key={index} />;
                }
                // Default paragraph
                return <p key={index} className="my-2">{line}</p>;
              })}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between">
          <Link 
            href={`/documents/edit/${document.id}`}
            className="inline-flex items-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
          >
            <FaEdit className="mr-2" /> Edit Document
          </Link>
          
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
          >
            {isDeleting ? (
              <>
                <FaSpinner className="animate-spin mr-2" /> Deleting...
              </>
            ) : (
              <>
                <FaTrash className="mr-2" /> Delete
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
} 