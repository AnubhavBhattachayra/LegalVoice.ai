'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaFileUpload, FaSpinner, FaDownload, FaShare, FaQuestionCircle } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  legalImplications: string[];
  recommendations: string[];
  references: Array<{
    title: string;
    url: string;
  }>;
  confidence: number;
  documentType: string;
  extractedFields: Record<string, any>;
}

export default function DocumentAnalysis() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const source = searchParams.get('source');

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);

  useEffect(() => {
    if (source) {
      // Handle pre-existing document analysis
      fetchAnalysis(source);
    }
  }, [source]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      await uploadAndAnalyze(selectedFile);
    }
  };

  const uploadAndAnalyze = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const { fileUrl } = await response.json();
      await analyzeDocument(fileUrl);
    } catch (error) {
      setError('Failed to upload and analyze document');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeDocument = async (fileUrl: string) => {
    try {
      setIsAnalyzing(true);
      setError(null);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl,
          userId: user?.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze document');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      setError('Failed to analyze document');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchAnalysis = async (source: string) => {
    try {
      setIsAnalyzing(true);
      setError(null);

      const response = await fetch(`/api/analysis/${source}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      setError('Failed to fetch analysis');
      console.error('Fetch error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion.trim() || !analysisResult) return;

    try {
      setIsGeneratingAnswer(true);
      setError(null);

      const response = await fetch('/api/ask-document-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion,
          documentId: analysisResult.documentType,
          userId: user?.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const { answer } = await response.json();
      setAnswers(prev => ({
        ...prev,
        [currentQuestion]: answer,
      }));
      setQuestions(prev => [...prev, currentQuestion]);
      setCurrentQuestion('');
    } catch (error) {
      setError('Failed to get answer');
      console.error('Question error:', error);
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const handleShare = async () => {
    try {
      const response = await fetch('/api/share-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisId: analysisResult?.documentType,
          userId: user?.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to share analysis');
      }

      const { shareUrl } = await response.json();
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      setError('Failed to share analysis');
      console.error('Share error:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Document Analysis</h1>

      {/* File Upload Section */}
      {!analysisResult && (
        <div className="mb-8">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Upload Document
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <FaFileUpload />
              <span>Choose File</span>
            </label>
            {file && <span className="text-sm text-gray-600">{file.name}</span>}
          </div>
        </div>
      )}

      {/* Loading States */}
      {(isUploading || isAnalyzing) && (
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-8">
          {/* Summary Section */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Document Summary</h2>
            <p className="text-gray-700">{analysisResult.summary}</p>
          </section>

          {/* Key Points Section */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Key Points</h2>
            <ul className="list-disc list-inside space-y-2">
              {analysisResult.keyPoints.map((point, index) => (
                <li key={index} className="text-gray-700">{point}</li>
              ))}
            </ul>
          </section>

          {/* Legal Implications Section */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Legal Implications</h2>
            <ul className="list-disc list-inside space-y-2">
              {analysisResult.legalImplications.map((implication, index) => (
                <li key={index} className="text-gray-700">{implication}</li>
              ))}
            </ul>
          </section>

          {/* Recommendations Section */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
            <ul className="list-disc list-inside space-y-2">
              {analysisResult.recommendations.map((recommendation, index) => (
                <li key={index} className="text-gray-700">{recommendation}</li>
              ))}
            </ul>
          </section>

          {/* References Section */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Legal References</h2>
            <ul className="space-y-2">
              {analysisResult.references.map((reference, index) => (
                <li key={index}>
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {reference.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleShare}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <FaShare />
              <span>Share Analysis</span>
            </button>
            <button
              onClick={() => window.print()}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <FaDownload />
              <span>Download Report</span>
            </button>
          </div>

          {/* Questions Section */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Ask Questions</h2>
            <form onSubmit={handleQuestionSubmit} className="mb-4">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  placeholder="Ask a question about the document..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isGeneratingAnswer || !currentQuestion.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <FaQuestionCircle />
                  <span>Ask</span>
                </button>
              </div>
            </form>

            {/* Previous Questions and Answers */}
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={index} className="border-b pb-4">
                  <p className="font-medium text-gray-900">Q: {question}</p>
                  <p className="text-gray-700 mt-2">A: {answers[question]}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
} 