'use client';

import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaPlus, FaTimes, FaSearch, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface Document {
  id: string;
  title: string;
  type: string;
  createdAt: string;
}

interface DocumentContextProps {
  selectedDocuments: Document[];
  onAddDocument: (document: Document) => void;
  onRemoveDocument: (documentId: string) => void;
}

const DocumentContext: React.FC<DocumentContextProps> = ({
  selectedDocuments,
  onAddDocument,
  onRemoveDocument
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchUserDocuments();
    }
  }, [isOpen]);

  const fetchUserDocuments = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // For now, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setAllDocuments([
        {
          id: '1',
          title: 'Rent Agreement',
          type: 'doc',
          createdAt: '2023-03-10T08:30:00.000Z'
        },
        {
          id: '2',
          title: 'Power of Attorney',
          type: 'pdf',
          createdAt: '2023-04-25T10:15:00.000Z'
        },
        {
          id: '3',
          title: 'Affidavit for Name Change',
          type: 'pdf',
          createdAt: '2023-06-10T15:45:00.000Z'
        },
        {
          id: '4',
          title: 'Income Declaration',
          type: 'doc',
          createdAt: '2023-07-05T12:30:00.000Z'
        },
        {
          id: '5',
          title: 'Will and Testament',
          type: 'pdf',
          createdAt: '2023-05-15T09:20:00.000Z'
        }
      ]);
    } catch (error) {
      toast.error('Failed to load documents');
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = allDocuments.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedDocuments.some(selected => selected.id === doc.id)
  );

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Document Context</h3>
        <p className="text-sm text-gray-600">
          Add documents to provide context for your chat with the AI assistant
        </p>
      </div>
      
      {/* Selected documents */}
      <div className="p-4">
        {selectedDocuments.length > 0 ? (
          <div className="space-y-2">
            {selectedDocuments.map(doc => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between p-2 bg-indigo-50 rounded-md border border-indigo-100"
              >
                <div className="flex items-center">
                  <FaFileAlt className="text-indigo-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">{doc.title}</span>
                </div>
                <button 
                  onClick={() => onRemoveDocument(doc.id)}
                  className="p-1 text-gray-500 hover:text-red-500"
                >
                  <FaTimes size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">
            No documents selected. Add documents to improve responses.
          </div>
        )}
      </div>
      
      {/* Add document button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center px-4 py-2 border border-indigo-300 rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
        >
          <FaPlus className="mr-2" /> Add Document
        </button>
      </div>
      
      {/* Document selector modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-[0.5] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Select Documents</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search your documents..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* Document list */}
            <div className="overflow-y-auto max-h-96 p-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <FaSpinner className="animate-spin text-indigo-600" />
                </div>
              ) : filteredDocuments.length > 0 ? (
                <div className="space-y-2">
                  {filteredDocuments.map(doc => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md cursor-pointer border border-gray-200"
                      onClick={() => {
                        onAddDocument(doc);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-indigo-100 rounded-md mr-3">
                          <FaFileAlt className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{doc.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.createdAt).toLocaleDateString()} • {doc.type.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <FaPlus className="text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No documents match your search' : 'No documents available'}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentContext; 