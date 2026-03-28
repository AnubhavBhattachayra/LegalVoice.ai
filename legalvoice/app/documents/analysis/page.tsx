'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { FaFileUpload, FaSpinner, FaArrowLeft, FaClipboard, FaCheck, FaTimesCircle, FaTimes, FaInfoCircle, FaExclamationTriangle, FaLightbulb } from 'react-icons/fa';
import analysisService, { DocumentAnalysis, AnalysisProgress } from '@/app/lib/services/analysisService';
import { useAuth } from '@/app/lib/context/AuthContext';
import { asyncHandler } from '@/app/lib/utils/errorHandler';

const DocumentAnalysisPage = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [analysisResults, setAnalysisResults] = useState<DocumentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Clean up function to handle component unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing analysis if component unmounts
      if (isAnalyzing) {
        setIsAnalyzing(false);
      }
    };
  }, [isAnalyzing]);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setDragActive(false);
      setError(null);
    }
  }, []);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Update drag active state
  useEffect(() => {
    setDragActive(isDragActive);
  }, [isDragActive]);

  // Handle file upload
  const handleUpload = asyncHandler(async () => {
    if (!file) {
      setError('Please select a file to analyze');
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisResults(null);
      setError(null);

      const response = await analysisService.uploadAndAnalyzeDocument(
        file,
        (progress: AnalysisProgress) => {
          setAnalysisProgress(progress);
        }
      );

      if (response.status === 'success' && response.data) {
        setAnalysisResults(response.data);
        
        // Scroll to results after a short delay
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      } else {
        setError(response.message || 'Failed to analyze document');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  }, [file]);

  // Handle file removal
  const handleRemoveFile = () => {
    setFile(null);
    setAnalysisResults(null);
    setAnalysisProgress(null);
  };

  // Copy summary to clipboard
  const handleCopyToClipboard = () => {
    if (!analysisResults) return;

    const textToCopy = `
# Document Analysis Summary
${analysisResults.summary}

## Key Points
${analysisResults.key_points.map((point, i) => `${i + 1}. ${point}`).join('\n')}
    `;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      toast.success('Summary copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Reset analysis
  const handleResetAnalysis = () => {
    setFile(null);
    setAnalysisResults(null);
    setAnalysisProgress(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Document Analysis</h1>
      
      {!analysisResults && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload a Legal Document</h2>
          <p className="text-gray-600 mb-6">
            Upload a legal document (PDF, DOC, DOCX, or TXT) to receive an AI-powered analysis, 
            including a summary, key points, potential issues, and more.
          </p>
          
          {/* File upload section */}
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            
            {file ? (
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 rounded-full p-3 mb-3">
                  <FaFileUpload className="text-blue-600 text-2xl" />
                </div>
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-gray-500 text-sm mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    Remove
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpload();
                    }}
                    disabled={isAnalyzing}
                    className={`px-4 py-2 text-sm text-white rounded-md ${
                      isAnalyzing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center">
                        <FaSpinner className="animate-spin mr-2" /> 
                        Analyzing...
                      </span>
                    ) : (
                      'Analyze Document'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 rounded-full p-3 mb-3">
                  <FaFileUpload className="text-blue-600 text-2xl" />
                </div>
                <p className="font-medium">Drag & drop your document here</p>
                <p className="text-gray-500 text-sm mt-1">or click to browse files</p>
                <p className="text-gray-400 text-xs mt-3">
                  Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
                </p>
              </div>
            )}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
              <FaTimesCircle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}
          
          {/* Analysis progress */}
          {analysisProgress && (
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {analysisProgress.message}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {Math.round(analysisProgress.progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ width: `${analysisProgress.progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Analysis results */}
      {analysisResults && (
        <div ref={resultsRef} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Analysis Results</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyToClipboard}
                className="flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                {copied ? (
                  <>
                    <FaCheck className="mr-1 text-green-600" /> Copied
                  </>
                ) : (
                  <>
                    <FaClipboard className="mr-1" /> Copy Summary
                  </>
                )}
              </button>
              <button
                onClick={handleResetAnalysis}
                className="flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                <FaTimes className="mr-1" /> Reset
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Document Summary</h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-md">
              {analysisResults.summary}
            </p>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Key Points</h3>
            <ul className="space-y-2">
              {analysisResults.key_points.map((point, index) => (
                <li key={index} className="flex">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Additional sections can be conditionally rendered if included in the response */}
        </div>
      )}
    </div>
  );
};

export default DocumentAnalysisPage; 