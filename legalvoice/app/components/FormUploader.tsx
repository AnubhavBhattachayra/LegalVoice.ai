'use client';

import React, { useState, useRef } from 'react';
import { FaUpload, FaFileUpload, FaSpinner, FaCheck, FaTimes, FaEye, FaFileAlt } from 'react-icons/fa';
import axios from 'axios';

interface FormUploaderProps {
  onUploadSuccess?: (formId: string, fields: Record<string, string>) => void;
}

const FormUploader: React.FC<FormUploaderProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditCost, setCreditCost] = useState<number | null>(null);
  const [extractedFields, setExtractedFields] = useState<Record<string, string> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setError(null);
    
    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      return;
    }
    
    // Check file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or image file (JPEG, PNG, TIFF)');
      setFile(null);
      setPreview(null);
      return;
    }
    
    // Check file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB');
      setFile(null);
      setPreview(null);
      return;
    }
    
    setFile(selectedFile);
    
    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      // For PDFs, just show an icon
      setPreview(null);
    }

    // Check credit cost (in a real implementation, this would be a backend call)
    setCreditCost(3); // Example cost
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles[0]) {
      // Trigger the file input change handler
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFiles[0]);
      
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    }
  };

  const resetUpload = () => {
    setFile(null);
    setPreview(null);
    setUploadSuccess(false);
    setError(null);
    setExtractedFields(null);
    setCreditCost(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Call the API
      const response = await axios.post('/api/forms/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadSuccess(true);
      setExtractedFields(response.data.extracted_fields);
      
      if (onUploadSuccess) {
        onUploadSuccess(response.data.form_id, response.data.extracted_fields);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error uploading form. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Form for AI Processing</h2>
      
      <div className="mb-4">
        <p className="text-gray-600">
          Upload a form document, and our AI will automatically extract fields and prepare it for filling.
        </p>
        {creditCost !== null && file && (
          <div className="mt-2 text-sm text-indigo-600 font-medium">
            This will use {creditCost} credits from your account
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <FaTimes className="text-red-500" />
            <p className="ml-3 text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {!uploadSuccess ? (
        <>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.tiff"
            />
            
            {!file ? (
              <div>
                <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600">
                  Drag and drop a file here, or click to select a file
                </p>
                <p className="mt-1 text-gray-500 text-sm">
                  PDF, JPG, PNG, TIFF up to 10MB
                </p>
              </div>
            ) : (
              <div>
                {preview ? (
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="max-h-64 mx-auto"
                  />
                ) : (
                  <FaFileAlt className="mx-auto h-16 w-16 text-indigo-600" />
                )}
                <p className="mt-2 text-gray-700 font-medium">{file.name}</p>
                <p className="text-gray-500 text-sm">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-between">
            {file && (
              <button
                onClick={resetUpload}
                className="text-gray-600 hover:text-gray-800"
              >
                Reset
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`ml-auto px-4 py-2 rounded-lg shadow flex items-center ${!file || uploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
            >
              {uploading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <FaFileUpload className="mr-2" />
                  Upload and Process Form
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <div>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <div className="flex">
              <FaCheck className="text-green-500" />
              <p className="ml-3 text-green-700">Form uploaded and processed successfully!</p>
            </div>
          </div>
          
          {extractedFields && Object.keys(extractedFields).length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Extracted Fields:</h3>
              <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                {Object.entries(extractedFields).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <span className="font-medium">{key}:</span> {value}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <button
              onClick={resetUpload}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Upload Another Form
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormUploader; 