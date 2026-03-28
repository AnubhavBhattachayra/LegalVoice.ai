import { NextRequest } from 'next/server';
import { apiResponse, apiErrorResponse } from '@/app/lib/utils/apiHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';

// Endpoint to setup 2FA
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return apiErrorResponse(
        'unauthorized',
        'You must be logged in to set up two-factor authentication',
        null,
        401
      );
    }
    
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    // Find user in database
    const user = await usersCollection.findOne({ _id: new ObjectId(authUser.id) });
    
    if (!user) {
      return apiErrorResponse(
        'user_not_found',
        'User not found',
        null,
        404
      );
    }
    
    // Check if user already has 2FA enabled
    if (user.twoFactorEnabled) {
      return apiErrorResponse(
        'already_enabled',
        'Two-factor authentication is already enabled for this account',
        null,
        400
      );
    }
    
    // Generate a new secret
    const secret = speakeasy.generateSecret({
      name: `LegalVoice:${user.email}`,
      length: 20 // recommended length for TOTP
    });
    
    // Save the secret to the user
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          twoFactorSecret: secret.base32,
          twoFactorEnabled: false, // Only set to true after verification
          twoFactorPending: true
        } 
      }
    );
    
    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || '');
    
    return apiResponse({
      message: 'Two-factor authentication setup initiated',
      secret: secret.base32,
      qrCodeUrl,
      otpauthUrl: secret.otpauth_url
    });
  } catch (error: any) {
    console.error('Error setting up two-factor authentication:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
} 