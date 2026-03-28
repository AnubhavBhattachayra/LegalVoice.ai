import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(
  request: NextRequest,
  { params }: { params: { session_id: string } }
) {
  try {
    // Get auth token from cookies
    const authToken = request.cookies.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get session ID from URL params
    const { session_id } = params;
    
    if (!session_id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Call backend API
    const response = await axios.get(
      `${process.env.BACKEND_URL}/ai-drafting/sessions/${session_id}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    // Return the response from the backend
    return NextResponse.json(response.data);
    
  } catch (error: any) {
    console.error('Error fetching drafting session:', error);
    
    // Forward error message from backend if available
    const errorMessage = error.response?.data?.detail || 'Failed to fetch drafting session';
    const statusCode = error.response?.status || 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 