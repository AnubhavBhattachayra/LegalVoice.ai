'use client';

import React, { useState, useEffect } from 'react';
import FileUploader from '../components/ui/FileUploader';
import { FaFileAlt, FaFolder, FaDownload, FaShare, FaTrash, FaEllipsisV } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import { useRouter } from 'next/navigation';

interface Document {
  _id: string;
  title: string;
  description: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('grid');
  const [authError, setAuthError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    fetchDocuments();
  }, [currentFolder]);

  async function fetchDocuments() {
    try {
      setIsLoading(true);
      setAuthError(false);
      
      const url = currentFolder 
        ? `/api/documents?folderId=${currentFolder}` 
        : '/api/documents';
        
      const response = await fetch(url);
      
      if (response.status === 401) {
        // Handle authentication error
        setAuthError(true);
        toast.error('Authentication required. Please log in.');
        // Clear documents to avoid showing stale data
        setDocuments([]);
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login?redirect=/documents');
        }, 2000);
        
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data = await response.json();
      
      if (data && data.success && Array.isArray(data.documents)) {
        setDocuments(data.documents);
      } else {
        // Handle case where data structure is different than expected
        console.warn('Unexpected API response format:', data);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleUploadSuccess = (document: Document) => {
    setDocuments((prev) => [document, ...prev]);
    setShowUploader(false);
    toast.success('Document uploaded successfully');
  };

  const handleUploadError = (error: any) => {
    toast.error(error.message || 'Failed to upload document');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDocumentClick = (documentId: string) => {
    setSelectedDocumentId(documentId === selectedDocumentId ? null : documentId);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      setDocuments((prev) => prev.filter((doc) => doc._id !== documentId));
      if (selectedDocumentId === documentId) {
        setSelectedDocumentId(null);
      }
      
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleDownloadDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const blob = await response.blob();
      const document = documents.find((doc) => doc._id === documentId);
      
      if (!document) {
        throw new Error('Document not found');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {documents.map((doc) => (
          <div
            key={doc._id}
            className={`relative p-4 border rounded-lg shadow-sm cursor-pointer transition-all ${
              selectedDocumentId === doc._id ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleDocumentClick(doc._id)}
          >
            <div className="flex flex-col items-center p-4">
              <div className="bg-blue-100 p-3 rounded-lg mb-3">
                <FaFileAlt className="text-blue-500 text-3xl" />
              </div>
              <h3 className="font-medium text-gray-800 text-center mb-1 truncate w-full">
                {doc.title}
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                {formatFileSize(doc.fileSize)} • {formatDate(doc.createdAt)}
              </p>
              {doc.tags && doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 justify-center">
                  {doc.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                      {tag}
                </span>
                  ))}
                  {doc.tags.length > 2 && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                      +{doc.tags.length - 2}
                </span>
                  )}
                </div>
              )}
              </div>
            
            {selectedDocumentId === doc._id && (
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadDocument(doc._id);
                  }}
                  className="p-1.5 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
                >
                  <FaDownload size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Implement share functionality
                    toast.success('Share dialog to be implemented');
                  }}
                  className="p-1.5 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
                >
                  <FaShare size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDocument(doc._id);
                  }}
                  className="p-1.5 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
        </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Modified</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc) => (
              <tr
                key={doc._id}
                className={`hover:bg-gray-50 cursor-pointer ${selectedDocumentId === doc._id ? 'bg-blue-50' : ''}`}
                onClick={() => handleDocumentClick(doc._id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaFileAlt className="text-blue-500 mr-3" />
                    <div className="truncate max-w-xs">{doc.title}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">
                    {doc.fileType?.split('/')[1] || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatFileSize(doc.fileSize)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(doc.updatedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadDocument(doc._id);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FaDownload size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Implement share functionality
                        toast.success('Share dialog to be implemented');
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FaShare size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc._id);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FaTrash size={16} />
                    </button>
                </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="My Documents" 
        description="Manage your legal documents and uploads" 
        actions={
          <div className="flex space-x-2">
            <button
              onClick={() => setShowUploader(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FaFileAlt className="mr-2" />
              Upload Document
            </button>
            <button
              onClick={() => toast.success('Create folder functionality to be implemented')}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
            >
              <FaFolder className="mr-2" />
              Create Folder
            </button>
          </div>
        }
      />
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          {/* Filter buttons would go here */}
        </div>

        <div className="flex space-x-2">
          <button
            className={`p-2 rounded ${currentView === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
            onClick={() => setCurrentView('grid')}
          >
            Grid
          </button>
          <button
            className={`p-2 rounded ${currentView === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
            onClick={() => setCurrentView('list')}
          >
            List
          </button>
                  </div>
                </div>
                
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading your documents...</p>
        </div>
      )}
      
      {authError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-500 text-xl mb-2">Authentication Required</div>
          <p className="text-gray-600 mb-4">You need to be logged in to view your documents.</p>
          <button 
            onClick={() => router.push('/login?redirect=/documents')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Go to Login
          </button>
                </div>
      )}
      
      {!isLoading && !authError && documents.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <FaFileAlt className="mx-auto text-gray-400 text-4xl mb-4" />
          <h3 className="text-gray-800 text-xl font-medium mb-2">No Documents Found</h3>
          <p className="text-gray-600 mb-6">You haven't uploaded any documents yet.</p>
          <button 
            onClick={() => setShowUploader(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center mx-auto"
          >
            <FaFileAlt className="mr-2" />
            Upload Your First Document
          </button>
        </div>
      )}
      
      {!isLoading && !authError && documents.length > 0 && (
        currentView === 'grid' ? renderGridView() : renderListView()
      )}
      
      {showUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Upload Document</h2>
              <button
                onClick={() => setShowUploader(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
              </div>
            <div className="p-6">
              <FileUploader
                onSuccess={handleUploadSuccess}
                onError={handleUploadError}
                folderId={currentFolder}
              />
            </div>
          </div>
        </div>
      )}
      </div>
  );
} 