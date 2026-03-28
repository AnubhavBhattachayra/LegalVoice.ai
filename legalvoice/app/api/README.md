# LegalVoice.AI API Documentation

This document provides a comprehensive overview of all API endpoints in the LegalVoice.AI application, including request/response formats, authentication requirements, and database schemas.

## Table of Contents

1. [Authentication API](#authentication-api)
2. [User API](#user-api)
3. [Document API](#document-api)
4. [Lawyer API](#lawyer-api)
5. [Booking API](#booking-api)
6. [Chat API](#chat-api)
7. [Payment API](#payment-api)
8. [Search API](#search-api)
9. [OCR API](#ocr-api)
10. [Admin API](#admin-api)
11. [Database Schemas](#database-schemas)

## Authentication API

### Base Path: `/api/auth`

| Endpoint | Method | Description | Authentication | Request Format | Response Format |
|----------|--------|-------------|----------------|----------------|-----------------|
| `/login` | POST | Authenticate user and return JWT token | None | `{ email, password }` | `{ success, token, user: { id, name, email, role } }` |
| `/register` | POST | Register new user | None | `{ name, email, password }` | `{ success, user: { id, name, email, role } }` |
| `/logout` | POST | Invalidate user session | Required | `{}` | `{ success }` |
| `/refresh-token` | POST | Refresh authentication token | Required | `{ refreshToken }` | `{ success, token, refreshToken }` |
| `/reset-password` | POST | Initiate password reset | None | `{ email }` | `{ success, message }` |
| `/reset-password/[token]` | POST | Complete password reset | None | `{ password, confirmPassword }` | `{ success, message }` |
| `/verify-email` | GET | Verify user email | None | Query params: `token` | `{ success, message }` |
| `/2fa/generate` | POST | Generate 2FA QR code | Required | `{}` | `{ success, qrCode, secret }` |
| `/2fa/verify` | POST | Verify 2FA code | Required | `{ code }` | `{ success, verified }` |

### Example Response:

```json
// Login Success Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6071f219c9e4c62b144214a2",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

## User API

### Base Path: `/api/users`

| Endpoint | Method | Description | Authentication | Request Format | Response Format |
|----------|--------|-------------|----------------|----------------|-----------------|
| `/me` | GET | Get current user profile | Required | N/A | `{ success, user }` |
| `/me` | PUT | Update user profile | Required | `{ name, email, phone, address, etc. }` | `{ success, user }` |
| `/me/password` | PUT | Change password | Required | `{ currentPassword, newPassword }` | `{ success, message }` |
| `/me/avatar` | PUT | Update profile picture | Required | Form data: `avatar` | `{ success, avatarUrl }` |
| `/[id]` | GET | Get user by ID (admin only) | Admin | N/A | `{ success, user }` |
| `/[id]` | PUT | Update user by ID (admin only) | Admin | `{ name, email, role, etc. }` | `{ success, user }` |
| `/[id]` | DELETE | Delete user by ID (admin only) | Admin | N/A | `{ success, message }` |

## Document API

### Base Path: `/api/documents`

| Endpoint | Method | Description | Authentication | Request Format | Response Format |
|----------|--------|-------------|----------------|----------------|-----------------|
| `/` | GET | List user documents | Required | Query params: `limit`, `page`, `sort`, `filter` | `{ success, data: { documents, pagination } }` |
| `/` | POST | Create new document | Required | `{ title, description, content, tags, folderId }` | `{ success, document }` |
| `/[id]` | GET | Get document by ID | Required | N/A | `{ success, document }` |
| `/[id]` | PUT | Update document by ID | Required | `{ title, description, content, tags }` | `{ success, document }` |
| `/[id]` | DELETE | Delete document by ID | Required | N/A | `{ success, message }` |
| `/[id]/share` | POST | Share document with others | Required | `{ emails, permission }` | `{ success, shares }` |
| `/[id]/download` | GET | Download document | Required | N/A | File stream |
| `/templates` | GET | Get document templates | Required | Query params: `category` | `{ success, templates }` |
| `/templates/[id]` | GET | Get template by ID | Required | N/A | `{ success, template }` |
| `/folders` | GET | Get document folders | Required | N/A | `{ success, folders }` |
| `/folders` | POST | Create folder | Required | `{ name, parentId }` | `{ success, folder }` |
| `/folders/[id]` | PUT | Update folder | Required | `{ name }` | `{ success, folder }` |
| `/folders/[id]` | DELETE | Delete folder | Required | N/A | `{ success, message }` |

## Lawyer API

### Base Path: `/api/lawyers`

| Endpoint | Method | Description | Authentication | Request Format | Response Format |
|----------|--------|-------------|----------------|----------------|-----------------|
| `/` | GET | List lawyers | Optional | Query params: `specialty`, `location`, `rating`, `page`, `limit` | `{ success, data: { lawyers, pagination } }` |
| `/[id]` | GET | Get lawyer profile | Optional | N/A | `{ success, lawyer }` |
| `/[id]/reviews` | GET | Get lawyer reviews | Optional | Query params: `page`, `limit` | `{ success, data: { reviews, pagination } }` |
| `/[id]/reviews` | POST | Add lawyer review | Required | `{ rating, comment }` | `{ success, review }` |
| `/[id]/availability` | GET | Get lawyer availability | Required | Query params: `date`, `month` | `{ success, slots }` |
| `/specialties` | GET | Get lawyer specialties | None | N/A | `{ success, specialties }` |
| `/register` | POST | Register as lawyer (for lawyers) | Required | `{ bio, specialty, education, experience, hourlyRate }` | `{ success, message }` |
| `/me` | GET | Get own lawyer profile (for lawyers) | Lawyer | N/A | `{ success, profile }` |
| `/me` | PUT | Update lawyer profile (for lawyers) | Lawyer | `{ bio, specialty, hourlyRate, etc. }` | `{ success, profile }` |
| `/me/availability` | PUT | Update availability (for lawyers) | Lawyer | `{ slots }` | `{ success, message }` |

## Booking API

### Base Path: `/api/bookings`

| Endpoint | Method | Description | Authentication | Request Format | Response Format |
|----------|--------|-------------|----------------|----------------|-----------------|
| `/` | GET | List user bookings | Required | Query params: `status`, `page`, `limit` | `{ success, data: { bookings, pagination } }` |
| `/` | POST | Create booking | Required | `{ lawyerId, dateTime, details, duration }` | `{ success, booking }` |
| `/[id]` | GET | Get booking details | Required | N/A | `{ success, booking }` |
| `/[id]` | PUT | Update booking | Required | `{ dateTime, details, duration }` | `{ success, booking }` |
| `/[id]` | DELETE | Cancel booking | Required | N/A | `{ success, message }` |
| `/lawyer` | GET | Get lawyer bookings (for lawyers) | Lawyer | Query params: `status`, `page`, `limit` | `{ success, data: { bookings, pagination } }` |
| `/[id]/status` | PUT | Update booking status (for lawyers) | Lawyer | `{ status }` | `{ success, booking }` |
| `/[id]/meeting` | GET | Get meeting details | Required | N/A | `{ success, meetingUrl, meetingId, password }` |

## Chat API

### Base Path: `/api/chat`

| Endpoint | Method | Description | Authentication | Request Format | Response Format |
|----------|--------|-------------|----------------|----------------|-----------------|
| `/` | POST | Send message to AI assistant | Required | `{ message, sessionId?, documentId? }` | `{ success, reply, sessionId }` |
| `/sessions` | GET | Get chat history/sessions | Required | Query params: `limit`, `page` | `{ success, data: { sessions, pagination } }` |
| `/sessions/[id]` | GET | Get chat session | Required | N/A | `{ success, messages, sessionInfo }` |
| `/sessions/[id]` | DELETE | Delete chat session | Required | N/A | `{ success, message }` |
| `/upload` | POST | Upload file to chat | Required | Form data: `file` | `{ success, fileUrl, fileId }` |
| `/analyze` | POST | Analyze document in chat | Required | `{ documentId, questions }` | `{ success, analysis }` |

## Payment API

### Base Path: `/api/payments`

| Endpoint | Method | Description | Authentication | Request Format | Response Format |
|----------|--------|-------------|----------------|----------------|-----------------|
| `/plans` | GET | Get subscription plans | None | N/A | `{ success, plans }` |
| `/checkout` | POST | Create checkout session | Required | `{ planId, successUrl, cancelUrl }` | `{ success, checkoutUrl, sessionId }` |
| `/checkout/[id]` | GET | Get checkout session status | Required | N/A | `{ success, status }` |
| `/invoices` | GET | Get user invoices | Required | Query params: `limit`, `page` | `{ success, data: { invoices, pagination } }` |
| `/subscription` | GET | Get user subscription | Required | N/A | `{ success, subscription }` |
| `/subscription` | PUT | Update subscription | Required | `{ planId }` | `{ success, subscription }` |
| `/subscription/cancel` | POST | Cancel subscription | Required | N/A | `{ success, message }` |
| `/payment-methods` | GET | Get payment methods | Required | N/A | `{ success, paymentMethods }` |
| `/payment-methods` | POST | Add payment method | Required | `{ paymentMethodId }` | `{ success, paymentMethod }` |
| `/payment-methods/[id]` | DELETE | Remove payment method | Required | N/A | `{ success, message }` |

## Search API

### Base Path: `/api/search`

| Endpoint | Method | Description | Authentication | Request Format | Response Format |
|----------|--------|-------------|----------------|----------------|-----------------|
| `/` | GET | Global search | Required | Query params: `q`, `type`, `limit` | `{ success, results: { documents, lawyers, chats } }` |
| `/documents` | GET | Search documents | Required | Query params: `q`, `limit`, `page` | `{ success, data: { documents, pagination } }` |
| `/lawyers` | GET | Search lawyers | Required | Query params: `q`, `limit`, `page` | `{ success, data: { lawyers, pagination } }` |

## OCR API

### Base Path: `/api/ocr`

| Endpoint | Method | Description | Authentication | Request Format | Response Format |
|----------|--------|-------------|----------------|----------------|-----------------|
| `/scan` | POST | OCR document scan | Required | Form data: `file` | `{ success, text, metadata }` |
| `/analyze` | POST | Analyze OCR results | Required | `{ text, documentType }` | `{ success, analysis, extractedData }` |
| `/extract` | POST | Extract structured data | Required | `{ documentId, fields }` | `{ success, data }` |

## Admin API

### Base Path: `/api/admin`

| Endpoint | Method | Description | Authentication | Request Format | Response Format |
|----------|--------|-------------|----------------|----------------|-----------------|
| `/users` | GET | Get all users | Admin | Query params: `page`, `limit`, `search` | `{ success, data: { users, pagination } }` |
| `/users/[id]` | GET | Get user details | Admin | N/A | `{ success, user }` |
| `/users/[id]` | PUT | Update user | Admin | `{ name, email, role, etc. }` | `{ success, user }` |
| `/users/[id]` | DELETE | Delete user | Admin | N/A | `{ success, message }` |
| `/documents` | GET | Get all documents | Admin | Query params: `page`, `limit`, `search` | `{ success, data: { documents, pagination } }` |
| `/lawyers` | GET | Get all lawyers | Admin | Query params: `page`, `limit`, `search` | `{ success, data: { lawyers, pagination } }` |
| `/lawyers/[id]` | PUT | Update lawyer profile | Admin | `{ verified, featured, bio, etc. }` | `{ success, lawyer }` |
| `/statistics` | GET | Get platform statistics | Admin | N/A | `{ success, stats }` |
| `/settings` | GET | Get platform settings | Admin | N/A | `{ success, settings }` |
| `/settings` | PUT | Update platform settings | Admin | `{ settingName: value, ... }` | `{ success, settings }` |

## Database Schemas

### User Schema

```typescript
interface User {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;  // Hashed
  role: "user" | "lawyer" | "admin";
  avatar?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  subscription?: {
    planId: string;
    status: "active" | "canceled" | "expired";
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  };
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Document Schema

```typescript
interface Document {
  _id: ObjectId;
  title: string;
  description?: string;
  content: string;
  format: "html" | "markdown" | "docx" | "pdf";
  tags: string[];
  userId: ObjectId;  // Owner
  folderId?: ObjectId;
  isTemplate: boolean;
  templateCategory?: string;
  access: {
    type: "private" | "shared" | "public";
    sharedWith?: Array<{
      userId: ObjectId;
      permission: "view" | "edit" | "comment";
    }>;
  };
  version: number;
  versionHistory: Array<{
    version: number;
    content: string;
    updatedAt: Date;
    updatedBy: ObjectId;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Folder Schema

```typescript
interface Folder {
  _id: ObjectId;
  name: string;
  userId: ObjectId;
  parentId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### Lawyer Schema

```typescript
interface Lawyer {
  _id: ObjectId;
  userId: ObjectId;
  bio: string;
  specialty: string[];
  education: Array<{
    institution: string;
    degree: string;
    year: number;
  }>;
  experience: Array<{
    company: string;
    position: string;
    startYear: number;
    endYear?: number;
    current: boolean;
  }>;
  barAssociation: string;
  licenseNumber: string;
  verified: boolean;
  featured: boolean;
  hourlyRate: number;
  availability: Array<{
    day: number;  // 0-6, Sunday-Saturday
    slots: Array<{
      start: string;  // HH:MM format
      end: string;    // HH:MM format
    }>;
  }>;
  languages: string[];
  rating: {
    average: number;
    count: number;
  };
  profileViews: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Review Schema

```typescript
interface Review {
  _id: ObjectId;
  lawyerId: ObjectId;
  userId: ObjectId;
  rating: number;  // 1-5
  comment: string;
  isVerifiedClient: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Booking Schema

```typescript
interface Booking {
  _id: ObjectId;
  lawyerId: ObjectId;
  userId: ObjectId;
  dateTime: Date;
  duration: number;  // In minutes
  details: string;
  status: "pending" | "confirmed" | "canceled" | "completed";
  meetingInfo?: {
    url: string;
    id: string;
    password?: string;
  };
  payment: {
    amount: number;
    currency: string;
    status: "pending" | "paid" | "refunded";
    transactionId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### ChatSession Schema

```typescript
interface ChatSession {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  lastMessageAt: Date;
  documentId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### ChatMessage Schema

```typescript
interface ChatMessage {
  _id: ObjectId;
  sessionId: ObjectId;
  sender: "user" | "ai";
  message: string;
  attachments?: Array<{
    type: "file" | "document";
    fileId: string;
    name: string;
    url: string;
  }>;
  createdAt: Date;
}
```

### Payment Schema

```typescript
interface Payment {
  _id: ObjectId;
  userId: ObjectId;
  type: "subscription" | "booking" | "service";
  referenceId?: ObjectId;  // BookingId, etc.
  amount: number;
  currency: string;
  status: "pending" | "successful" | "failed" | "refunded";
  provider: "stripe" | "paypal";
  providerTransactionId: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Subscription Plan Schema

```typescript
interface SubscriptionPlan {
  _id: ObjectId;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  limits: {
    documents: number;
    storage: number;  // In MB
    consultations: number;
    ocr: number;
  };
  isActive: boolean;
  stripePriceId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### OCRDocument Schema

```typescript
interface OCRDocument {
  _id: ObjectId;
  userId: ObjectId;
  originalFile: {
    name: string;
    url: string;
    size: number;
    type: string;
  };
  processedText: string;
  analysis?: {
    documentType: string;
    extractedFields: Record<string, any>;
    summary: string;
    legalTerms: Array<{
      term: string;
      definition: string;
      locations: number[];  // Character positions
    }>;
  };
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Notification Schema

```typescript
interface Notification {
  _id: ObjectId;
  userId: ObjectId;
  type: "document" | "booking" | "message" | "system";
  title: string;
  message: string;
  referenceId?: ObjectId;
  referenceType?: string;
  isRead: boolean;
  createdAt: Date;
}
``` 