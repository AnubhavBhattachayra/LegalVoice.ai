# Firebase Authentication in LegalVoice.ai

This document provides information about how Firebase authentication works in our application and how to deal with common issues like token expiration.

## Authentication Flow

1. **Sign In/Sign Up:** Users sign in or register using Firebase Auth (email/password or Google Auth)
2. **Token Generation:** After successful authentication, Firebase provides an ID token (JWT)
3. **Token Storage:** The token is stored in both client-side cookies (for JS access) and secure HTTP-only cookies (for API calls)
4. **Token Verification:** Server-side APIs verify the token using Firebase Admin SDK
5. **Token Refresh:** Tokens are automatically refreshed before they expire (every 5 minutes)

## Key Components

### Client-Side

- **useAuth Hook** (`app/hooks/useAuth.ts`): Manages user authentication state, token refresh, and cookie storage
- **Auth Cookies**: Multiple cookies store different aspects of authentication:
  - `firebase_auth_token` & `auth_token`: HTTP-only cookies with the Firebase ID token
  - `user_email` & `user_uid`: Non-HTTP-only cookies for fallback authentication
- **Token Check**: Client periodically checks token validity with the server and refreshes as needed

### Server-Side

- **Token Verifier** (`app/lib/auth/tokenVerifier.ts`): Utility for verifying Firebase tokens with proper error handling
- **Token Check API** (`app/api/auth/check/route.ts`): Endpoint to check token validity status
- **Middleware** (`middleware.ts`): Handles route protection and token decoding/validation
- **API Authentication**: Individual API routes use the token verifier to authenticate requests

## Token Expiration Handling

Firebase ID tokens expire after 1 hour by default. Our application handles this with multiple strategies:

1. **Proactive Refresh**: Tokens are refreshed every 5 minutes using Firebase's `getIdToken(true)`
2. **Server Sync**: Client checks with the server before refreshing tokens to ensure they're actually needed
3. **Token Payload Extraction**: If a token is expired but still parseable, we extract the user information
4. **Cookie Fallback**: User email and UID stored in cookies are used as fallback authentication
5. **Multiple Event Handlers**: Tokens are refreshed on tab focus, visibility change, and network reconnection

## Debugging Authentication Issues

If users are experiencing authentication problems:

1. Check browser console for token refresh errors
2. Use the token check endpoint to see if the token is valid: `POST /api/auth/check`
3. Verify the presence of authentication cookies in the browser
4. Check server logs for token verification errors

## Best Practices for Developers

1. **Always Use Token Verifier**: Use the `verifyAuthToken` function from `tokenVerifier.ts` for all authentication
2. **Include Multiple User Identifiers**: When storing user data, include multiple identifiers (email, UID, etc.)
3. **Handle Fallbacks Gracefully**: Always have a fallback for expired tokens using email-based authentication
4. **Refresh Tokens on Critical Actions**: Force token refresh before critical actions using `refreshToken(true)`
5. **Security First**: Never trust client-side data; always verify authentication on the server

## Firebase Token Specifications

Firebase ID tokens are JWTs with the following key claims:

| Claim | Description | Verification |
|-------|-------------|--------------|
| `aud` | Project ID | Must be your Firebase project ID |
| `auth_time` | Authentication time | Must be in the past |
| `exp` | Expiration time | Must be in the future (1 hour after issuance) |
| `iat` | Issued-at time | Must be in the past |
| `iss` | Issuer | Must be "https://securetoken.google.com/<projectId>" |
| `sub` | Subject (User ID) | Must be non-empty |
| `uid` | User ID | Same as `sub` |
| `email` | User's email | Optional, depends on authentication method |

## Recent Improvements (April 2023)

We've made several improvements to make token handling more robust:

1. **More Frequent Refresh**: Reduced token refresh interval from 10 minutes to 5 minutes
2. **Token Payload Decoding**: Middleware now decodes tokens to check expiration without requiring Firebase
3. **Client-Server Token Sync**: Added a token check endpoint to verify token status
4. **Enhanced Failure Recovery**: Multiple fallback mechanisms and automatic recovery for expired tokens
5. **Improved Logging**: Better diagnostic information in both client and server logs

## Troubleshooting Common Issues

| Issue | Possible Causes | Solution |
|-------|----------------|----------|
| "Token expired" errors | Firebase token has expired | The app should automatically refresh tokens. If issues persist, try logging out and back in |
| Missing sessions | User data stored with different identifiers | We use multiple user identifiers to find data. Make sure the email is correctly associated |
| Authentication loops | Cookie storage issues | Clear browser cookies and log in again |
| No auth token found | Browser cookie settings | Ensure cookies are not blocked by browser settings |
| "Invalid ID token" errors | Token verification failed | Check browser console and server logs. The app should automatically handle this with fallback auth |