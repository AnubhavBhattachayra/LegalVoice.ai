# Authentication System Documentation

## Overview

LegalVoice.ai uses Firebase Authentication with long-lived session cookies for a seamless authentication experience. This document outlines how our authentication system works and the key components involved.

## Authentication Flow

1. **User Login**: User logs in using Firebase Authentication (email/password or Google provider).
2. **Session Creation**: Upon successful login, the client obtains a Firebase ID token and exchanges it for a session cookie via the `/api/auth/sessionLogin` endpoint.
3. **Session Cookie**: The server creates a session cookie with a 14-day expiration, which is stored as an HTTP-only cookie for security.
4. **Client-Side User Info**: Basic user information (email, name, UID) is also stored in regular cookies for the client.
5. **Authentication Checks**: All routes are protected by middleware that checks for valid session cookies.
6. **Session Refresh**: The `AuthRefresher` component periodically checks and refreshes the session when needed.

## Key Components

### Server-Side Components

#### Session Login (`/api/auth/sessionLogin/route.ts`)
- Exchanges Firebase ID tokens for session cookies
- Sets HTTP-only session cookie plus user info cookies
- Handles token validation and error states

#### Session Logout (`/api/auth/sessionLogout/route.ts`)
- Clears all session and authentication cookies
- Optionally revokes refresh tokens on the Firebase side

#### Auth Check (`/api/auth/check/route.ts`)
- Verifies if the current session is valid
- Returns session status, expiration info, and user details
- Handles refresh requests via headers

#### Token Verifier (`/app/lib/auth/tokenVerifier.ts`)
- Comprehensive authentication verification utility
- Checks session cookies and ID tokens
- Provides fallback mechanisms for expired tokens

#### Middleware (`middleware.ts`)
- Protects routes based on authentication status
- Checks for session cookies, ID tokens, and user info
- Handles redirects and authorization responses

### Client-Side Components

#### Auth Hook (`/app/hooks/useAuth.ts`)
- Manages authentication state and operations
- Handles login, logout, registration, and password reset
- Creates and refreshes session cookies
- Stores user information

#### Auth Refresher (`/app/components/AuthRefresher.tsx`)
- Background component that maintains authentication freshness
- Periodically checks session status
- Refreshes session when necessary

## Authentication Methods

LegalVoice.ai supports multiple authentication methods:

1. **Session Cookie** (primary method)
   - HTTP-only cookie containing Firebase session information
   - 14-day expiration
   - Secure and resistant to XSS attacks

2. **Firebase ID Token** (legacy/fallback)
   - Short-lived JWT token (1 hour expiration)
   - Used only for initial authentication or if session cookies fail

3. **User Info Cookies** (supplementary)
   - Store basic user details (email, name, UID)
   - Used for UI personalization and fallback authentication

## Session Cookie Advantages

Session cookies provide significant advantages over ID tokens:

1. **Longer Expiration**: Session cookies last up to 14 days vs. 1 hour for ID tokens
2. **Enhanced Security**: HTTP-only cookies are not accessible to JavaScript
3. **Reduced Token Refresh**: Fewer refreshes needed, minimizing API calls to Firebase
4. **Improved UX**: Users stay logged in much longer without disruption

## Error Handling

The authentication system has robust error handling:

1. **Expired Sessions**: When session cookies expire, the system instructs the client to create a new session
2. **Network Issues**: The system retries authentication operations when network issues occur
3. **Fallback Authentication**: If token verification fails, the system falls back to user info cookies

## Best Practices

When modifying the authentication system:

1. Always maintain the HTTP-only flag for session cookies
2. Keep user info in both server and client cookies for redundancy
3. Implement proper CSRF protection for authentication endpoints
4. Use the `verifyAuthToken` utility for consistent auth verification
5. Test all authentication flows including expiration scenarios 