'use client';

import React, { useState } from 'react';
import { FaFileUpload, FaList } from 'react-icons/fa';
import FormUploader from '@/app/components/FormUploader';

export default function FormsPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
  const [uploadedFormId, setUploadedFormId] = useState<string | null>(null);
  const [uploadedFields, setUploadedFields] = useState<Record<string, string> | null>(null);
  
  const handleUploadSuccess = (formId: string, fields: Record<string, string>) => {
    setUploadedFormId(formId);
    setUploadedFields(fields);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Form Processing</h1>
      
      <div className="flex mb-6 border-b">
        <button
          className={`px-4 py-2 flex items-center ${
            activeTab === 'upload' 
              ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('upload')}
        >
          <FaFileUpload className="mr-2" />
          Upload Form
        </button>
        <button
          className={`px-4 py-2 flex items-center ${
            activeTab === 'history' 
              ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('history')}
        >
          <FaList className="mr-2" />
          My Forms
        </button>
      </div>
      
      {activeTab === 'upload' && (
        <div>
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4">
            <p className="text-blue-700">
              Upload legal forms and our AI will automatically extract fields for easy filling.
              This feature uses your document credits.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormUploader onUploadSuccess={handleUploadSuccess} />
            
            {uploadedFormId && uploadedFields && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Fill Form</h2>
                <p className="text-gray-600 mb-4">
                  Enter the values for each field to fill in your form.
                </p>
                
                <form className="space-y-4">
                  {Object.entries(uploadedFields).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {key}
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={value || ''}
                      />
                    </div>
                  ))}
                  
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md shadow"
                  >
                    Fill and Download Form
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'history' && (
        <div>
          <p className="text-gray-600 mb-4">
            View your previously uploaded forms and their statuses.
          </p>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Form Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* This would be populated with actual form data from an API call */}
                <tr className="text-gray-500 text-sm">
                  <td className="px-6 py-4 whitespace-nowrap">
                    Sample Form.pdf
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    Affidavit
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Processed
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                      View
                    </button>
                    <button className="text-indigo-600 hover:text-indigo-900">
                      Fill
                    </button>
                  </td>
                </tr>
                <tr className="text-gray-500 text-sm">
                  <td className="px-6 py-4 whitespace-nowrap">
                    Legal Notice.pdf
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    Legal Notice
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(Date.now() - 86400000).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      Filled
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                      View
                    </button>
                    <button className="text-indigo-600 hover:text-indigo-900">
                      Download
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 