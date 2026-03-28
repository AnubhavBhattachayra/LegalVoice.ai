import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Remove the HTTP-only cookie
    cookies().delete({
      name: 'auth_token',
      path: '/',
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing token cookie:', error);
    return NextResponse.json(
      { error: 'Failed to remove token' },
      { status: 500 }
    );
  }
} 