import { NextRequest } from 'next/server';
import { apiResponse, apiErrorResponse } from '@/app/lib/utils/apiHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { OAuth2Client } from 'google-auth-library';

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Social login endpoint
export async function POST(request: NextRequest) {
  try {
    const { provider, token, userData } = await request.json();
    
    if (!provider || !token) {
      return apiErrorResponse(
        'missing_parameters',
        'Provider and token are required',
        null,
        400
      );
    }
    
    // Validate token based on provider
    let validatedUser;
    let emailVerified = false;
    
    switch (provider) {
      case 'google':
        try {
          validatedUser = await verifyGoogleToken(token);
          emailVerified = validatedUser.email_verified;
        } catch (error) {
          console.error('Google token verification failed:', error);
          return apiErrorResponse(
            'invalid_token',
            'Invalid or expired Google token',
            null,
            401
          );
        }
        break;
        
      case 'facebook':
        try {
          validatedUser = await verifyFacebookToken(token);
          // Facebook API returns verified accounts only
          emailVerified = true;
        } catch (error) {
          console.error('Facebook token verification failed:', error);
          return apiErrorResponse(
            'invalid_token',
            'Invalid or expired Facebook token',
            null,
            401
          );
        }
        break;
        
      case 'apple':
        try {
          validatedUser = await verifyAppleToken(token);
          // Apple sign in guarantees verified email
          emailVerified = true;
        } catch (error) {
          console.error('Apple token verification failed:', error);
          return apiErrorResponse(
            'invalid_token',
            'Invalid or expired Apple token',
            null,
            401
          );
        }
        break;
        
      default:
        return apiErrorResponse(
          'unsupported_provider',
          `Provider ${provider} is not supported`,
          null,
          400
        );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    // Check if user exists by email
    let user = await usersCollection.findOne({ email: validatedUser.email });
    
    if (user) {
      // Update existing user's social login info
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            [`socialLogins.${provider}`]: {
              id: validatedUser.id || validatedUser.sub,
              lastLogin: new Date()
            },
            lastLogin: new Date(),
            emailVerified: emailVerified || user.emailVerified
          } 
        }
      );
    } else {
      // Create new user
      const newUser = {
        email: validatedUser.email,
        firstName: validatedUser.given_name || validatedUser.first_name || userData?.firstName || '',
        lastName: validatedUser.family_name || validatedUser.last_name || userData?.lastName || '',
        profileImage: validatedUser.picture || validatedUser.avatar || userData?.profileImage,
        emailVerified: emailVerified,
        role: 'user',
        createdAt: new Date(),
        lastLogin: new Date(),
        socialLogins: {
          [provider]: {
            id: validatedUser.id || validatedUser.sub,
            lastLogin: new Date()
          }
        }
      };
      
      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }
    
    // Generate JWT token
    const authToken = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        role: user.role || 'user'
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );
    
    // Store token in HTTP-only cookie
    cookies().set({
      name: 'auth_token',
      value: authToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });
    
    // Return user data (excluding sensitive information)
    const { password, ...safeUserData } = user;
    
    return apiResponse({
      success: true,
      message: `Logged in successfully with ${provider}`,
      user: safeUserData
    });
  } catch (error: any) {
    console.error('Social login error:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
}

// Verify Google token
async function verifyGoogleToken(token: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  
  return ticket.getPayload();
}

// Verify Facebook token
async function verifyFacebookToken(token: string) {
  // Facebook token verification requires an API call to Facebook Graph API
  const response = await fetch(
    `https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token=${token}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to verify Facebook token');
  }
  
  return await response.json();
}

// Verify Apple token
async function verifyAppleToken(token: string) {
  // Apple token verification is complex and requires multiple steps
  // This is a placeholder - implement proper Apple Sign In verification
  // See: https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/verifying_a_user
  
  // For now, we'll just decode the token and trust it (NOT FOR PRODUCTION)
  const decoded = jwt.decode(token);
  
  if (!decoded || typeof decoded === 'string') {
    throw new Error('Invalid Apple token');
  }
  
  return decoded;
} 