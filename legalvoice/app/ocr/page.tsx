'use client';

import { useState, useRef } from 'react';
import { FaCloudUploadAlt, FaFileUpload, FaFileAlt, FaCheck, FaSpinner, FaTrash, FaDownload, FaRedo } from 'react-icons/fa';

export default function OCR() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview for image files
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreview(event.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        // For PDF files
        setPreview(null);
      }
      
      // Reset processing states
      setIsProcessed(false);
      setExtractedText('');
      setSummary('');
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process the uploaded document
  const processDocument = () => {
    if (!file) return;
    
    setIsProcessing(true);
    
    // Simulate OCR processing
    setTimeout(() => {
      // Sample extracted text for demonstration
      const sampleText = `AFFIDAVIT

I, Rajesh Kumar Singh, son of Shri Mohan Lal Singh, aged 45 years, residing at Flat No. 403, Sunshine Apartments, Sector 15, Gurugram, Haryana - 122001, do hereby solemnly affirm and declare as follows:

1. That I am a permanent resident of the above-mentioned address.
2. That I am employed as Senior Manager at XYZ Technologies Pvt. Ltd., Cybercity, Gurugram.
3. That my annual income from all sources is approximately Rs. 12,00,000/- (Rupees Twelve Lakhs only).
4. That I am submitting this affidavit for the purpose of income verification required by the bank for my home loan application.
5. That the statements made above are true to the best of my knowledge and belief.

Verified at Gurugram on this 15th day of March, 2023.

Deponent
Rajesh Kumar Singh`;

      setExtractedText(sampleText);
      
      // Generate a sample summary
      const sampleSummary = `This is an income affidavit sworn by Rajesh Kumar Singh (45 years old) residing in Gurugram. He declares his annual income as Rs. 12,00,000 and is employed as Senior Manager at XYZ Technologies. The affidavit is dated March 15, 2023, and is being submitted for home loan verification purposes.`;
      
      setSummary(sampleSummary);
      setIsProcessing(false);
      setIsProcessed(true);
    }, 3000);
  };

  // Reset the states
  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setIsProcessed(false);
    setExtractedText('');
    setSummary('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Document Analysis with OCR</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload legal documents to extract text, analyze content, and get summaries. 
            Our AI can process images and PDFs to help you understand complex legal documents.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Document Upload Section */}
          <div className={`bg-white rounded-xl shadow-md overflow-hidden ${isProcessed ? 'order-2' : 'order-1'}`}>
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upload Document</h2>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*, application/pdf"
                className="hidden"
              />
              
              {!file ? (
                <div 
                  onClick={triggerFileInput}
                  className="border-2 border-dashed border-indigo-300 rounded-lg p-8 text-center cursor-pointer hover:bg-indigo-50 transition duration-300"
                >
                  <FaCloudUploadAlt className="mx-auto text-5xl text-indigo-500 mb-4" />
                  <p className="text-gray-700 mb-2">Drag and drop your document here</p>
                  <p className="text-gray-500 text-sm mb-4">or click to browse files</p>
                  <p className="text-xs text-gray-500">
                    Supported formats: JPG, PNG, PDF (max 10MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                    <div className="flex items-center">
                      <FaFileAlt className="text-indigo-500 text-xl mr-3" />
                      <div>
                        <p className="font-medium text-gray-800">{file.name}</p>
                        <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button 
                      onClick={resetForm}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  
                  {preview && (
                    <div className="border rounded-lg overflow-hidden">
                      <img 
                        src={preview} 
                        alt="Document preview" 
                        className="w-full object-contain max-h-80"
                      />
                    </div>
                  )}
                  
                  {!isProcessing && !isProcessed ? (
                    <button
                      onClick={processDocument}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center"
                    >
                      <FaFileUpload className="mr-2" /> Process Document
                    </button>
                  ) : isProcessing ? (
                    <button
                      disabled
                      className="w-full py-3 bg-indigo-400 text-white rounded-lg font-medium flex items-center justify-center"
                    >
                      <FaSpinner className="mr-2 animate-spin" /> Processing...
                    </button>
                  ) : (
                    <button
                      onClick={resetForm}
                      className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium flex items-center justify-center"
                    >
                      <FaRedo className="mr-2" /> Process Another Document
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className={`bg-white rounded-xl shadow-md overflow-hidden ${isProcessed ? 'order-1' : 'order-2'}`}>
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Analysis Results</h2>
              
              {isProcessed ? (
                <div className="space-y-6">
                  {/* Success Message */}
                  <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center">
                    <FaCheck className="mr-2" /> Document processed successfully
                  </div>
                  
                  {/* Summary */}
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Document Summary</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-gray-700">{summary}</p>
                    </div>
                  </div>
                  
                  {/* Extracted Text */}
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Extracted Text</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-80 overflow-y-auto">
                      <pre className="text-gray-700 whitespace-pre-wrap font-sans">{extractedText}</pre>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-4">
                    <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center">
                      <FaDownload className="mr-2" /> Download Text
                    </button>
                    <button className="flex-1 py-2 bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium flex items-center justify-center">
                      Explain in Simple Terms
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-gray-100 rounded-full p-6 mb-4">
                    <FaFileAlt className="text-gray-400 text-4xl" />
                  </div>
                  <h3 className="font-medium text-gray-800 mb-2">No Results Yet</h3>
                  <p className="text-gray-500 max-w-md">
                    Upload a document and click "Process Document" to extract text and analyze the content
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-800 mb-8 text-center">
            Our OCR Analysis Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <FaFileAlt className="text-indigo-600 text-xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Text Extraction</h3>
              <p className="text-gray-600">
                Extract text from scanned documents, photos of documents, and PDFs with high accuracy.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Document Analysis</h3>
              <p className="text-gray-600">
                Identify document type, extract key information, and organize content in a structured format.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Legal Explanation</h3>
              <p className="text-gray-600">
                Get simplified explanations of complex legal terms and clauses in plain language.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 