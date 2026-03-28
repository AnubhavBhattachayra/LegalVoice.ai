import { NextRequest } from 'next/server';
import { 
  createSuccessApiResponse, 
  createErrorApiResponse, 
  validateRequiredFields, 
  createValidationErrorResponse 
} from '@/app/lib/utils/apiHelpers';
import { getFirebaseAuth } from '@/app/lib/utils/firebaseAdmin';

/**
 * Send password reset email to user
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    const { valid, missingFields } = validateRequiredFields(body, ['email']);
    if (!valid) {
      return createValidationErrorResponse(missingFields);
    }
    
    const { email } = body;
    
    // Get Firebase Auth instance
    const auth = getFirebaseAuth();
    
    // Send password reset email
    await auth.generatePasswordResetLink(email);
    
    return createSuccessApiResponse({
      message: 'Password reset email sent successfully'
    });
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/user-not-found') {
      // Return success anyway to prevent email enumeration attacks
      return createSuccessApiResponse({
        message: 'Password reset email sent successfully'
      });
    }
    
    if (error.code === 'auth/invalid-email') {
      return createErrorApiResponse(
        'invalid_email',
        'The email address is invalid',
        null,
        400
      );
    }
    
    return createErrorApiResponse(
      'reset_password_error',
      'Failed to send password reset email',
      null,
      500
    );
  }
}

/**
 * Confirm password reset with token and new password
 */
export async function PUT(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    const { valid, missingFields } = validateRequiredFields(body, ['oobCode', 'newPassword']);
    if (!valid) {
      return createValidationErrorResponse(missingFields);
    }
    
    const { oobCode, newPassword } = body;
    
    // Get Firebase Auth instance
    const auth = getFirebaseAuth();
    
    // Verify the password reset code
    try {
      await auth.verifyPasswordResetCode(oobCode);
    } catch (error: any) {
      return createErrorApiResponse(
        'invalid_reset_code',
        'The password reset code is invalid or has expired',
        null,
        400
      );
    }
    
    // Confirm password reset
    await auth.confirmPasswordReset(oobCode, newPassword);
    
    return createSuccessApiResponse({
      message: 'Password reset successful'
    });
  } catch (error: any) {
    console.error('Error confirming password reset:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/weak-password') {
      return createErrorApiResponse(
        'weak_password',
        'The password is too weak. It should be at least 6 characters',
        null,
        400
      );
    }
    
    if (error.code === 'auth/invalid-action-code') {
      return createErrorApiResponse(
        'invalid_reset_code',
        'The password reset code is invalid or has expired',
        null,
        400
      );
    }
    
    return createErrorApiResponse(
      'reset_password_error',
      'Failed to reset password',
      null,
      500
    );
  }
} 