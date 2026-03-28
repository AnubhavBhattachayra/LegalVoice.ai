# LegalVoice.AI

LegalVoice.AI is a comprehensive legal technology platform that provides AI-assisted document creation, legal consultations, document analysis, and more. This application is built with Next.js, React, and TypeScript, leveraging modern web technologies to deliver a seamless user experience.

## Table of Contents

1. [Project Overview](#project-overview)
2. [File Structure](#file-structure)
3. [Pages and Routes](#pages-and-routes)
4. [API Endpoints](#api-endpoints)
5. [Key Components](#key-components)
6. [Algorithms and Special Features](#algorithms-and-special-features)
7. [Authentication and Authorization](#authentication-and-authorization)
8. [Database and Storage](#database-and-storage)
9. [Getting Started](#getting-started)
10. [Environment Variables](#environment-variables)
11. [Development and Deployment](#development-and-deployment)

## Project Overview

LegalVoice.AI is designed to bridge the gap between complex legal procedures and the average person by leveraging AI and user-friendly interfaces. Key features include:

- AI-assisted document creation and analysis
- Legal professional consultation booking
- Document management and storage
- OCR-powered document scanning and interpretation
- User authentication and profile management
- Admin dashboard for platform management
- Payment processing and billing management

## File Structure

The project follows a standard Next.js 13+ application structure with the App Router:

```
legalvoice/
├── app/                        # Main application code (Next.js App Router)
│   ├── api/                    # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── documents/          # Document management endpoints
│   │   ├── lawyers/            # Lawyer profile and booking endpoints
│   │   ├── upload/             # File upload endpoints
│   │   └── ...                 # Other API endpoints
│   ├── components/             # Reusable React components
│   │   ├── ui/                 # UI components (buttons, inputs, etc.)
│   │   ├── layout/             # Layout components
│   │   └── features/           # Feature-specific components
│   ├── lib/                    # Utility libraries and functions
│   │   ├── db/                 # Database connection and models
│   │   └── utils/              # Helper utilities
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript type definitions
│   ├── context/                # React context providers
│   ├── about/                  # About page
│   ├── chat/                   # AI Chat interface
│   ├── dashboard/              # User dashboard
│   ├── documents/              # Document management
│   ├── features/               # Features page
│   ├── profile/                # User profile
│   ├── lawyers/                # Lawyers directory
│   ├── login/                  # Login page
│   ├── register/               # Registration page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── ...                     # Other page routes
├── public/                     # Static assets
├── node_modules/               # Dependencies
├── backend/                    # Additional backend services
├── .env.local                  # Environment variables
├── next.config.ts              # Next.js configuration
├── package.json                # Project dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Project documentation
```

## Pages and Routes

### Public Pages

| Route | Description | File Location | Connected To |
|-------|-------------|--------------|--------------|
| `/` | Home page | `app/page.tsx` | Auth, Features, About |
| `/about` | About the platform | `app/about/page.tsx` | Home |
| `/features` | Platform features | `app/features/page.tsx` | Home, Registration |
| `/contact` | Contact page | `app/contact/page.tsx` | Home, About |
| `/login` | User login | `app/login/page.tsx` | Registration, Dashboard |
| `/register` | User registration | `app/register/page.tsx` | Login, Dashboard |
| `/forgot-password` | Password recovery | `app/forgot-password/page.tsx` | Login |
| `/unauthorized` | Access denied page | `app/unauthorized/page.tsx` | - |

### Authenticated Pages

| Route | Description | File Location | Connected To |
|-------|-------------|--------------|--------------|
| `/dashboard` | Main user dashboard | `app/dashboard/page.tsx` | Documents, Lawyers, Chat |
| `/profile` | User profile management | `app/profile/page.tsx` | Settings |
| `/settings` | User settings | `app/settings/page.tsx` | Profile |
| `/documents` | Document management | `app/documents/page.tsx` | Dashboard, OCR |
| `/documents/[id]` | Document detail view | `app/documents/[id]/page.tsx` | Documents |
| `/chat` | AI assistant chat | `app/chat/page.tsx` | Dashboard |
| `/lawyers` | Lawyers directory | `app/lawyers/page.tsx` | Consultation |
| `/consultation` | Book consultations | `app/consultation/page.tsx` | Lawyers, Dashboard |
| `/ocr` | Document scanning | `app/ocr/page.tsx` | Documents |
| `/analysis` | Document analysis | `app/analysis/page.tsx` | Documents |
| `/billing` | Billing management | `app/billing/page.tsx` | Dashboard, Payments |
| `/payments` | Payment history | `app/payments/page.tsx` | Billing |
| `/checkout` | Payment checkout | `app/checkout/page.tsx` | Billing |
| `/verify-email` | Email verification | `app/verify-email/page.tsx` | Login, Dashboard |
| `/verify-2fa` | Two-factor auth | `app/verify-2fa/page.tsx` | Login, Dashboard |
| `/research` | Legal research tools | `app/research/page.tsx` | Dashboard |
| `/learn` | Learning resources | `app/learn/page.tsx` | Dashboard |

### Admin Pages

| Route | Description | File Location | Connected To |
|-------|-------------|--------------|--------------|
| `/admin` | Admin dashboard | `app/admin/page.tsx` | Various admin pages |
| `/admin/users` | User management | `app/admin/users/page.tsx` | Admin Dashboard |
| `/admin/documents` | Document management | `app/admin/documents/page.tsx` | Admin Dashboard |
| `/admin/lawyers` | Lawyer management | `app/admin/lawyers/page.tsx` | Admin Dashboard |

## API Endpoints

### Authentication API

| Endpoint | Method | Description | Request Format | Response Format |
|----------|--------|-------------|----------------|-----------------|
| `/api/auth/login` | POST | User login | `{ email, password }` | `{ success, token, user }` |
| `/api/auth/register` | POST | User registration | `{ name, email, password }` | `{ success, user }` |
| `/api/auth/logout` | POST | User logout | `{}` | `{ success }` |
| `/api/auth/reset-password` | POST | Password reset | `{ email }` | `{ success, message }` |
| `/api/auth/verify-email` | GET | Email verification | Query params: `token` | `{ success, message }` |

### Document API

| Endpoint | Method | Description | Request Format | Response Format |
|----------|--------|-------------|----------------|-----------------|
| `/api/documents` | GET | List documents | Query params: `limit`, `page` | `{ success, data: { documents, pagination } }` |
| `/api/documents` | POST | Create document | `{ title, description, content, tags }` | `{ success, document }` |
| `/api/documents/[id]` | GET | Get document | Path param: `id` | `{ success, document }` |
| `/api/documents/[id]` | PUT | Update document | `{ title, description, content, tags }` | `{ success, document }` |
| `/api/documents/[id]` | DELETE | Delete document | Path param: `id` | `{ success, message }` |
| `/api/documents/[id]/download` | GET | Download document | Path param: `id` | File stream |
| `/api/upload/file` | POST | Upload file | Form data: `file` | `{ success, document }` |

### Lawyers API

| Endpoint | Method | Description | Request Format | Response Format |
|----------|--------|-------------|----------------|-----------------|
| `/api/lawyers` | GET | List lawyers | Query params: `specialty`, `location` | `{ success, lawyers }` |
| `/api/lawyers/[id]` | GET | Get lawyer profile | Path param: `id` | `{ success, lawyer }` |
| `/api/lawyers/[id]/availability` | GET | Get availability | Path params: `id`, query: `date` | `{ success, slots }` |
| `/api/lawyers/[id]/book` | POST | Book consultation | `{ date, time, details }` | `{ success, booking }` |

### Chat API

| Endpoint | Method | Description | Request Format | Response Format |
|----------|--------|-------------|----------------|-----------------|
| `/api/chat` | POST | Send message | `{ message, sessionId }` | `{ success, reply }` |
| `/api/chat/sessions` | GET | Get chat history | Query params: `limit` | `{ success, sessions }` |
| `/api/chat/sessions/[id]` | GET | Get chat session | Path param: `id` | `{ success, messages }` |

## Key Components

### UI Components

| Component | Description | File Location | Used In |
|-----------|-------------|--------------|---------|
| `FileUploader` | Drag-and-drop file uploader | `app/components/ui/FileUploader.tsx` | Documents page |
| `PageHeader` | Page header with title and actions | `app/components/ui/PageHeader.tsx` | Multiple pages |
| `SearchBar` | Global search functionality | `app/components/ui/SearchBar.tsx` | Layout |
| `Button` | Styled button component | `app/components/ui/Button.tsx` | Multiple pages |
| `Modal` | Modal dialog component | `app/components/ui/Modal.tsx` | Multiple pages |
| `Notification` | Toast notifications | `app/components/ui/Notification.tsx` | Multiple pages |
| `Loading` | Loading spinner/indicator | `app/components/ui/Loading.tsx` | Multiple pages |

### Feature Components

| Component | Description | File Location | Used In |
|-----------|-------------|--------------|---------|
| `DocumentList` | List of user documents | `app/components/features/DocumentList.tsx` | Documents page |
| `ChatInterface` | AI chat conversation UI | `app/components/features/ChatInterface.tsx` | Chat page |
| `LawyerCard` | Lawyer profile card | `app/components/features/LawyerCard.tsx` | Lawyers page |
| `BookingCalendar` | Consultation booking calendar | `app/components/features/BookingCalendar.tsx` | Consultation page |
| `OCRScanner` | Document scanner interface | `app/components/features/OCRScanner.tsx` | OCR page |
| `PaymentForm` | Credit card payment form | `app/components/features/PaymentForm.tsx` | Checkout page |

## Algorithms and Special Features

### OCR Document Analysis
- **Location**: `app/lib/utils/ocrProcessing.ts`
- **Description**: Uses machine learning to extract text from uploaded documents, identify legal terms, and provide explanations.
- **Connected To**: OCR page, Document Analysis

### AI Legal Assistant
- **Location**: `app/lib/services/aiService.ts`
- **Description**: Natural language processing to understand legal questions and provide relevant information.
- **Connected To**: Chat interface, Document Analysis

### Document Template Generation
- **Location**: `app/lib/generators/documentGenerator.ts`
- **Description**: Creates legal documents using predefined templates and user inputs.
- **Connected To**: Document creation pages

### Smart Search
- **Location**: `app/lib/utils/search.ts`
- **Description**: Advanced search algorithms for finding relevant documents and information across the platform.
- **Connected To**: SearchBar component, used throughout the application

### Lawyer Matching Algorithm
- **Location**: `app/lib/services/lawyerMatching.ts`
- **Description**: Matches users with appropriate lawyers based on legal needs, specialty, and location.
- **Connected To**: Lawyers page, Consultation booking

## Authentication and Authorization

The application uses a JWT-based authentication system with role-based access control:

- **User Authentication**: Email/password login, social logins, two-factor authentication
- **Role Management**: User roles (regular user, lawyer, admin) with appropriate permissions
- **Session Management**: Secure session handling with automatic token refresh
- **Protected Routes**: Middleware-based route protection in Next.js

Key authentication files:
- **JWT Handling**: `app/lib/utils/authHelpers.ts`
- **Authentication API**: `app/api/auth/[...nextauth]/route.ts`
- **Route Protection**: `app/middleware.ts`
- **Auth Context**: `app/context/AuthContext.tsx`

## Database and Storage

The application uses MongoDB for the database and supports various storage options:

- **Database Connection**: `app/lib/db/mongodb.ts`
- **File Storage**: Local storage and cloud storage options (AWS S3, Azure Blob Storage)
- **Data Models**: 
  - Users: `app/lib/models/User.ts`
  - Documents: `app/lib/models/Document.ts`
  - Lawyers: `app/lib/models/Lawyer.ts`
  - Bookings: `app/lib/models/Booking.ts`
  - Payments: `app/lib/models/Payment.ts`

## Getting Started

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn
- MongoDB database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/legalvoice.git
cd legalvoice
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your values
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

The following environment variables need to be configured in `.env.local`:

```
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/legalvoice
MONGODB_DB=legalvoice

# Authentication
JWT_SECRET=your-jwt-secret-here
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Email Service
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@example.com
EMAIL_SERVER_PASSWORD=your-email-password

# Payment Processing
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# AI Services
OPENAI_API_KEY=your-openai-api-key
```

## Development and Deployment

### Development Guidelines
- Follow the Next.js best practices and TypeScript standards
- Use atomic commits with descriptive messages
- Test thoroughly before creating pull requests

### Building for Production
```bash
npm run build
# or
yarn build
```

### Running in Production
```bash
npm run start
# or
yarn start
```

### Deployment Options
- Vercel (recommended for Next.js applications)
- AWS Amplify
- Docker container with Nginx

---

For questions or support, please contact our development team at dev@legalvoice.ai or open an issue on GitHub.
