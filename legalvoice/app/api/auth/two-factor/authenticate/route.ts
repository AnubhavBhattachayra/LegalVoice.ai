import { NextRequest } from 'next/server';
import { apiResponse, apiErrorResponse } from '@/app/lib/utils/apiHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import * as speakeasy from 'speakeasy';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Endpoint for 2FA authentication
export async function POST(request: NextRequest) {
  try {
    const { userId, token, backupCode } = await request.json();
    
    if (!userId) {
      return apiErrorResponse(
        'missing_user_id',
        'User ID is required',
        null,
        400
      );
    }
    
    if (!token && !backupCode) {
      return apiErrorResponse(
        'missing_verification',
        'Either a verification code or backup code is required',
        null,
        400
      );
    }
    
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    // Find user in database
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(userId)
    });
    
    if (!user) {
      return apiErrorResponse(
        'user_not_found',
        'User not found',
        null,
        404
      );
    }
    
    // Check if 2FA is enabled for this user
    if (!user.twoFactorEnabled) {
      return apiErrorResponse(
        'not_enabled',
        'Two-factor authentication is not enabled for this account',
        null,
        400
      );
    }
    
    let isAuthenticated = false;
    
    // Check if using TOTP or backup code
    if (token) {
      // Verify the TOTP token
      isAuthenticated = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 periods before and after for clock skew
      });
    } else if (backupCode) {
      // Verify backup code
      const hashedBackupCode = hashCode(backupCode);
      
      // Find the backup code in the user's backup codes
      const backupCodeIndex = user.backupCodes?.findIndex(
        (code: any) => code.code === hashedBackupCode && !code.used
      );
      
      if (backupCodeIndex !== undefined && backupCodeIndex >= 0) {
        isAuthenticated = true;
        
        // Mark the backup code as used
        await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: { 
              [`backupCodes.${backupCodeIndex}.used`]: true,
              [`backupCodes.${backupCodeIndex}.usedAt`]: new Date()
            } 
          }
        );
      }
    }
    
    if (!isAuthenticated) {
      return apiErrorResponse(
        'invalid_code',
        'Invalid verification code or backup code',
        null,
        400
      );
    }
    
    // Generate new authentication token
    const authToken = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        role: user.role || 'user',
        twoFactorAuthenticated: true
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' } // Longer expiry for authenticated users
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
    
    // Update user's last login time
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );
    
    // Return success and user data (excluding sensitive fields)
    const { 
      password, 
      twoFactorSecret, 
      backupCodes, 
      ...safeUserData 
    } = user;
    
    return apiResponse({
      success: true,
      message: 'Two-factor authentication successful',
      user: safeUserData
    });
  } catch (error: any) {
    console.error('Error in 2FA authentication:', error);
    return apiErrorResponse(
      'internal_error',
      'An unexpected error occurred',
      error.message,
      500
    );
  }
}

// Simple hashing function - in production use a proper crypto hashing
function hashCode(code: string) {
  // This is a placeholder - use proper crypto in production
  return crypto.createHash('sha256').update(code).digest('hex');
} 