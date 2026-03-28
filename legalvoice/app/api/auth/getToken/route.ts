import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Check if the request is from the server side middleware
  const authSecret = request.headers.get('x-auth-middleware-secret');
  
  if (!authSecret || authSecret !== process.env.AUTH_MIDDLEWARE_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const token = cookies().get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error getting token cookie:', error);
    return NextResponse.json(
      { error: 'Failed to get token' },
      { status: 500 }
    );
  }
} 