import { NextRequest } from 'next/server';
import { apiResponse, apiErrorResponse } from '@/app/lib/utils/apiHelpers';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { ObjectId } from 'mongodb';

// Endpoint to request email verification
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return apiErrorResponse(
        'missing_email',
        'Email is required',
        null,
        400
      );
    }
    
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    // Check if user exists
    const user = await usersCollection.findOne({ email });
    
    if (!user) {
      return apiErrorResponse(
        'user_not_found',
        'User with this email does not exist',
        null,
        404
      );
    }
    
    if (user.emailVerified) {
      return apiErrorResponse(
        'already_verified',
        'Email is already verified',
        null,
        400
      );
    }
    
    // Generate verification token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        type: 'email_verification'
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );
    
    // Store token in database (for extra security)
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          verificationToken: token,
          verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        } 
      }
    );
    
    // In a real application, send email with verification link
    // Example: await sendVerificationEmail(user.email, token);
    
    // For development, return the token directly
    return apiResponse({ 
      message: 'Verification email sent',
      // Only include token in development
      token: process.env.NODE_ENV !== 'production' ? token : undefined
    });
  } catch (error: any) {
    console.error('Error requesting email verification:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
}

// Endpoint to verify email with token
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    
    if (!token) {
      return apiErrorResponse(
        'missing_token',
        'Verification token is required',
        null,
        400
      );
    }
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (error) {
      return apiErrorResponse(
        'invalid_token',
        'Verification token is invalid or expired',
        null,
        400
      );
    }
    
    if (decoded.type !== 'email_verification') {
      return apiErrorResponse(
        'invalid_token_type',
        'Invalid token type',
        null,
        400
      );
    }
    
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    // Find user with this token
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(decoded.userId),
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });
    
    if (!user) {
      return apiErrorResponse(
        'invalid_token',
        'Verification token is invalid or expired',
        null,
        400
      );
    }
    
    // Mark email as verified
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { emailVerified: true },
        $unset: { verificationToken: "", verificationTokenExpires: "" }
      }
    );
    
    // Return success
    return apiResponse({ 
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error: any) {
    console.error('Error verifying email:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
} 