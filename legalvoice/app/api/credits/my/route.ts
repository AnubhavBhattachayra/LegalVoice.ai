import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
    const authToken = request.cookies.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Call backend API
    const response = await axios.get(
      `${process.env.BACKEND_URL}/credits/my`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    // Return the response from the backend
    return NextResponse.json(response.data);
    
  } catch (error: any) {
    console.error('Error fetching user credits:', error);
    
    // Forward error message from backend if available
    const errorMessage = error.response?.data?.detail || 'Failed to fetch user credits';
    const statusCode = error.response?.status || 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 