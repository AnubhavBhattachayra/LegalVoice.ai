import React, { useState, useRef, useCallback } from 'react';
import { FaUpload, FaFile, FaTimes, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface FileUploaderProps {
  onUploadSuccess?: (document: any) => void;
  onUploadError?: (error: any) => void;
  allowedTypes?: string[];
  maxSize?: number;
  title?: string;
  description?: string;
  tags?: string;
  folderId?: string;
  className?: string;
}

const DEFAULT_ALLOWED_TYPES = [
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/rtf',
  'application/json'
];

const DEFAULT_MAX_SIZE = 20 * 1024 * 1024; // 20MB

export default function FileUploader({
  onUploadSuccess,
  onUploadError,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  maxSize = DEFAULT_MAX_SIZE,
  title = '',
  description = '',
  tags = '',
  folderId = '',
  className = ''
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const selectedFile = files[0];
      
      // Validate file type
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('File type not allowed');
        return;
      }
      
      // Validate file size
      if (selectedFile.size > maxSize) {
        toast.error(`File size exceeds the maximum allowed size of ${maxSize / (1024 * 1024)}MB`);
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    handleFileChange(files);
  }, [handleFileChange]);

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('file', file);
      
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);
      if (tags) formData.append('tags', tags);
      if (folderId) formData.append('folderId', folderId);
      
      // Simulated upload progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
      
      const response = await fetch('/api/upload/file', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }
      
      const data = await response.json();
      toast.success('File uploaded successfully');
      
      // Reset state
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(data.document);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
      
      // Call error callback
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className={`flex flex-col w-full ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={file ? undefined : openFileSelector}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files)}
          accept={allowedTypes.join(',')}
        />
        
        {!file ? (
          <>
            <FaUpload className="text-gray-400 text-3xl mb-2" />
            <p className="text-gray-700 mb-1 font-medium">Drag and drop a file, or click to select</p>
            <p className="text-gray-500 text-sm">
              Allowed types: {allowedTypes.map(t => t.split('/')[1]).join(', ')}
            </p>
            <p className="text-gray-500 text-sm">
              Max size: {formatFileSize(maxSize)}
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center justify-between w-full p-3 bg-gray-100 rounded mb-3">
              <div className="flex items-center">
                <FaFile className="text-blue-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="text-gray-500 hover:text-red-500"
              >
                <FaTimes />
              </button>
            </div>
            
            {isUploading ? (
              <div className="w-full">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Uploading...</span>
                  <span className="text-sm text-gray-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleUpload}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Upload File
              </button>
            )}
          </div>
        )}
      </div>
      
      {isUploading && (
        <div className="flex items-center justify-center mt-4">
          <FaSpinner className="animate-spin text-blue-500 mr-2" />
          <span className="text-gray-700">Uploading...</span>
        </div>
      )}
    </div>
  );
} 