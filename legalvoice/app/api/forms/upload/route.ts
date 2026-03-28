import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookies
    const authToken = request.cookies.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get form data
    const formData = await request.formData();
    
    // Create multipart/form-data request to backend
    const backendFormData = new FormData();
    
    // Add each field from the original form data
    for (const [key, value] of Array.from(formData.entries())) {
      backendFormData.append(key, value as string | Blob);
    }
    
    // Call backend API
    const response = await axios.post(
      `${process.env.BACKEND_URL}/forms/upload`,
      backendFormData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    // Return the response from the backend
    return NextResponse.json(response.data);
    
  } catch (error: any) {
    console.error('Error uploading form:', error);
    
    // Forward error message from backend if available
    const errorMessage = error.response?.data?.detail || 'Failed to upload and process form';
    const statusCode = error.response?.status || 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 