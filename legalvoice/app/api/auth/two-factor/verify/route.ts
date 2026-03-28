import { NextRequest } from 'next/server';
import { apiResponse, apiErrorResponse } from '@/app/lib/utils/apiHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import * as speakeasy from 'speakeasy';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';

// Endpoint to verify 2FA token and enable 2FA
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return apiErrorResponse(
        'unauthorized',
        'You must be logged in to verify two-factor authentication',
        null,
        401
      );
    }
    
    const { token } = await request.json();
    
    if (!token) {
      return apiErrorResponse(
        'missing_token',
        'Verification token is required',
        null,
        400
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
    
    // If 2FA is already enabled, reject
    if (user.twoFactorEnabled) {
      return apiErrorResponse(
        'already_enabled',
        'Two-factor authentication is already enabled for this account',
        null,
        400
      );
    }
    
    // If no pending 2FA setup, reject
    if (!user.twoFactorPending || !user.twoFactorSecret) {
      return apiErrorResponse(
        'no_pending_setup',
        'No pending two-factor authentication setup found',
        null,
        400
      );
    }
    
    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 periods before and after for clock skew
    });
    
    if (!verified) {
      return apiErrorResponse(
        'invalid_token',
        'Invalid verification code',
        null,
        400
      );
    }
    
    // Enable 2FA for the user
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          twoFactorEnabled: true,
          twoFactorPending: false
        } 
      }
    );
    
    // Create backup codes (for account recovery)
    const backupCodes = generateBackupCodes();
    
    // Hash backup codes for storage
    const hashedBackupCodes = backupCodes.map(code => ({
      code: hashCode(code),
      used: false
    }));
    
    // Store backup codes
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { backupCodes: hashedBackupCodes } }
    );
    
    return apiResponse({
      success: true,
      message: 'Two-factor authentication enabled successfully',
      backupCodes // Send plaintext backup codes to user (only once)
    });
  } catch (error: any) {
    console.error('Error verifying two-factor authentication:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
}

// Generate 8 backup codes
function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate a random 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

// Simple hashing function - in production use a proper crypto hashing
function hashCode(code: string) {
  // This is a placeholder - use proper crypto in production
  return require('crypto').createHash('sha256').update(code).digest('hex');
} 