import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Decode the token to get the expiry
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      const expiryDate = new Date(decoded.exp * 1000);
      
      // Set the HTTP-only cookie
      cookies().set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: expiryDate,
        path: '/',
      });
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error decoding token:', error);
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error setting token cookie:', error);
    return NextResponse.json(
      { error: 'Failed to set token' },
      { status: 500 }
    );
  }
} 