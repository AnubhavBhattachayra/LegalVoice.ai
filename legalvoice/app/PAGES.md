# LegalVoice.AI Pages Documentation

This document provides a comprehensive overview of all pages in the LegalVoice.AI application, including their purpose, components used, and connections to other pages.

## Table of Contents

1. [Public Pages](#public-pages)
2. [Authentication Pages](#authentication-pages)
3. [Dashboard Pages](#dashboard-pages)
4. [Document Management Pages](#document-management-pages)
5. [Communication Pages](#communication-pages) 
6. [Lawyer Pages](#lawyer-pages)
7. [Administrative Pages](#administrative-pages)
8. [Utility Pages](#utility-pages)

## Public Pages

### Home Page
- **Path**: `/`
- **File**: `app/page.tsx`
- **Purpose**: Main landing page showcasing the platform features and benefits
- **Key Components**:
  - `HeroSection` - Main banner with call-to-action
  - `FeatureSection` - Highlights key platform features
  - `TestimonialCarousel` - Client testimonials
  - `PricingSection` - Subscription plan options
  - `FAQSection` - Frequently asked questions
- **Connected To**: About, Features, Login, Register

### About Page
- **Path**: `/about`
- **File**: `app/about/page.tsx`
- **Purpose**: Provides information about LegalVoice.AI, its mission, team, and values
- **Key Components**:
  - `TeamSection` - Team member profiles
  - `MissionStatement` - Company mission and vision
  - `TimelineSection` - Company history and milestones
- **Connected To**: Home, Contact

### Features Page
- **Path**: `/features`
- **File**: `app/features/page.tsx`
- **Purpose**: Detailed explanation of platform features with examples and use cases
- **Key Components**:
  - `FeatureGrid` - Visual representation of features
  - `FeatureDetail` - In-depth explanation of each feature
  - `DemoVideo` - Feature demonstration videos
- **Connected To**: Home, Pricing, Register

### Contact Page
- **Path**: `/contact`
- **File**: `app/contact/page.tsx`
- **Purpose**: Contact form and information for user inquiries
- **Key Components**:
  - `ContactForm` - Form for sending inquiries
  - `ContactInfo` - Address, phone, email information
  - `GoogleMap` - Office location map
- **Connected To**: Home, About

### Pricing Page
- **Path**: `/pricing`
- **File**: `app/pricing/page.tsx`
- **Purpose**: Subscription plans and pricing details
- **Key Components**:
  - `PricingTable` - Comparison of different plans
  - `FeatureComparison` - Detailed feature availability by plan
  - `FAQSection` - Pricing-related frequently asked questions
- **Connected To**: Home, Checkout, Register

## Authentication Pages

### Login Page
- **Path**: `/login`
- **File**: `app/login/page.tsx`
- **Purpose**: User authentication for existing accounts
- **Key Components**:
  - `LoginForm` - Email/password form with validation
  - `SocialLogin` - Third-party authentication options
  - `TwoFactorForm` - 2FA verification (conditional)
- **Connected To**: Register, Forgot Password, Dashboard

### Registration Page
- **Path**: `/register`
- **File**: `app/register/page.tsx`
- **Purpose**: New user account creation
- **Key Components**:
  - `RegistrationForm` - User registration form with validation
  - `SocialSignup` - Third-party account creation
  - `TermsAndConditions` - Legal agreements
- **Connected To**: Login, Email Verification

### Forgot Password Page
- **Path**: `/forgot-password`
- **File**: `app/forgot-password/page.tsx`
- **Purpose**: Password recovery process
- **Key Components**:
  - `EmailForm` - Form to request password reset
  - `SuccessMessage` - Email sent confirmation
- **Connected To**: Login, Reset Password

### Reset Password Page
- **Path**: `/reset-password/[token]`
- **File**: `app/reset-password/[token]/page.tsx`
- **Purpose**: Set new password after reset link is clicked
- **Key Components**:
  - `ResetPasswordForm` - New password form with validation
  - `PasswordRequirements` - Password security guidelines
- **Connected To**: Login

### Email Verification Page
- **Path**: `/verify-email`
- **File**: `app/verify-email/page.tsx`
- **Purpose**: Verify user email address
- **Key Components**:
  - `VerificationStatus` - Success/failure message
  - `ResendEmailForm` - Option to resend verification email
- **Connected To**: Login, Dashboard

### Two-Factor Authentication Page
- **Path**: `/verify-2fa`
- **File**: `app/verify-2fa/page.tsx`
- **Purpose**: Verify 2FA code during login
- **Key Components**:
  - `TwoFactorForm` - Code input form
  - `RecoveryOptions` - Alternative verification methods
- **Connected To**: Login, Dashboard

## Dashboard Pages

### Main Dashboard
- **Path**: `/dashboard`
- **File**: `app/dashboard/page.tsx`
- **Purpose**: Central hub for user activities and information
- **Key Components**:
  - `AnalyticsSummary` - Usage statistics and metrics
  - `RecentDocuments` - Recently accessed documents
  - `UpcomingConsultations` - Scheduled lawyer meetings
  - `QuickActions` - Common action shortcuts
  - `NotificationCenter` - Recent notifications
- **Connected To**: Documents, Lawyers, Chat, Profile, Settings

### User Profile Page
- **Path**: `/profile`
- **File**: `app/profile/page.tsx`
- **Purpose**: User profile information and management
- **Key Components**:
  - `ProfileHeader` - User photo and basic info
  - `PersonalInfoForm` - Edit personal information
  - `ActivityHistory` - Recent platform activity
  - `AccountStats` - Usage statistics
- **Connected To**: Dashboard, Settings

### Settings Page
- **Path**: `/settings`
- **File**: `app/settings/page.tsx`
- **Purpose**: User preferences and account settings
- **Key Components**:
  - `SettingsTabs` - Navigation between setting categories
  - `SecuritySettings` - Password and 2FA configuration
  - `NotificationSettings` - Communication preferences
  - `BillingSettings` - Payment methods and history
  - `AccountSettings` - Account management options
- **Connected To**: Profile, Dashboard, Billing

## Document Management Pages

### Documents Dashboard
- **Path**: `/documents`
- **File**: `app/documents/page.tsx`
- **Purpose**: Document library and management
- **Key Components**:
  - `DocumentGrid` - Visual document library
  - `DocumentFilter` - Search and filtering options
  - `FolderTree` - Document organization structure
  - `DocumentUploader` - Upload new documents
- **Connected To**: Dashboard, Document Detail, OCR

### Document Detail Page
- **Path**: `/documents/[id]`
- **File**: `app/documents/[id]/page.tsx`
- **Purpose**: View and edit individual documents
- **Key Components**:
  - `DocumentViewer` - Document rendering
  - `DocumentEditor` - Content editing interface
  - `VersionHistory` - Previous document versions
  - `SharingOptions` - Collaboration controls
  - `CommentSection` - Document annotations
- **Connected To**: Documents, Chat (for analysis)

### Document Creation Page
- **Path**: `/documents/create`
- **File**: `app/documents/create/page.tsx`
- **Purpose**: Create new legal documents from templates or scratch
- **Key Components**:
  - `TemplateSelector` - Template categories and options
  - `DocumentBuilder` - Document creation interface
  - `FormEditor` - Form field management
  - `AIAssistant` - Assistance with document creation
- **Connected To**: Documents, Templates

### Template Browser
- **Path**: `/templates`
- **File**: `app/templates/page.tsx`
- **Purpose**: Browse and select document templates
- **Key Components**:
  - `TemplateCategories` - Template organization
  - `TemplateCard` - Template preview and info
  - `TemplateFinder` - Search and filter templates
- **Connected To**: Document Creation

### OCR Scanning Page
- **Path**: `/ocr`
- **File**: `app/ocr/page.tsx`
- **Purpose**: Scan physical documents for digital conversion
- **Key Components**:
  - `ScannerInterface` - Document scanning controls
  - `OCRPreview` - Scanned document preview
  - `TextExtraction` - Extracted text view
  - `DocumentProcessor` - Post-processing options
- **Connected To**: Documents, Analysis

### Document Analysis Page
- **Path**: `/analysis`
- **File**: `app/analysis/page.tsx`
- **Purpose**: AI-powered document analysis and insights
- **Key Components**:
  - `AnalysisOptions` - Analysis type selector
  - `DocumentSummary` - Key document information
  - `LegalTermExplainer` - Legal terminology definitions
  - `RiskAssessment` - Potential issues identification
  - `ActionItems` - Recommended next steps
- **Connected To**: Documents, Chat

## Communication Pages

### Chat Interface
- **Path**: `/chat`
- **File**: `app/chat/page.tsx`
- **Purpose**: AI assistant interaction for legal help
- **Key Components**:
  - `ChatWindow` - Message display area
  - `MessageInput` - User input interface
  - `DocumentAttachment` - File upload capability
  - `SuggestedQuestions` - AI-suggested queries
  - `ChatSessions` - Previous conversation history
- **Connected To**: Dashboard, Documents

### Chat Session Page
- **Path**: `/chat/[id]`
- **File**: `app/chat/[id]/page.tsx`
- **Purpose**: View specific chat conversation
- **Key Components**:
  - `MessageThread` - Conversation history
  - `SessionInfo` - Session metadata
  - `ExportOptions` - Export conversation
- **Connected To**: Chat, Documents

## Lawyer Pages

### Lawyers Directory
- **Path**: `/lawyers`
- **File**: `app/lawyers/page.tsx`
- **Purpose**: Browse and find legal professionals
- **Key Components**:
  - `LawyerFilter` - Search and filtering options
  - `LawyerGrid` - Visual directory of lawyers
  - `SpecialtyFilter` - Filter by legal specialty
  - `LocationFilter` - Filter by geographical area
- **Connected To**: Dashboard, Lawyer Profile, Consultation

### Lawyer Profile Page
- **Path**: `/lawyers/[id]`
- **File**: `app/lawyers/[id]/page.tsx`
- **Purpose**: View lawyer details and credentials
- **Key Components**:
  - `ProfileHeader` - Lawyer photo and basic info
  - `CredentialsSection` - Education and certifications
  - `ExperienceTimeline` - Work history
  - `ReviewSection` - Client reviews and ratings
  - `BookingButton` - Schedule consultation option
- **Connected To**: Lawyers Directory, Consultation

### Consultation Booking Page
- **Path**: `/consultation`
- **File**: `app/consultation/page.tsx`
- **Purpose**: Schedule consultations with lawyers
- **Key Components**:
  - `LawyerSelector` - Choose lawyer for consultation
  - `AvailabilityCalendar` - View available time slots
  - `BookingForm` - Enter consultation details
  - `PaymentForm` - Process consultation payment
- **Connected To**: Lawyers, Dashboard

### Consultation Detail Page
- **Path**: `/consultation/[id]`
- **File**: `app/consultation/[id]/page.tsx`
- **Purpose**: View upcoming or past consultation details
- **Key Components**:
  - `ConsultationInfo` - Date, time, lawyer details
  - `ConsultationStatus` - Status indicator
  - `MeetingLink` - Virtual meeting access
  - `DocumentSharing` - Document sharing options
  - `CancellationOption` - Cancel consultation option
- **Connected To**: Consultation, Dashboard

## Administrative Pages

### Admin Dashboard
- **Path**: `/admin`
- **File**: `app/admin/page.tsx`
- **Purpose**: Platform administration and oversight
- **Key Components**:
  - `AdminNav` - Admin section navigation
  - `StatisticsDashboard` - Platform usage metrics
  - `RecentActivity` - Latest platform activities
  - `SystemStatus` - System health indicators
- **Connected To**: Various admin pages

### User Management
- **Path**: `/admin/users`
- **File**: `app/admin/users/page.tsx`
- **Purpose**: Manage platform users
- **Key Components**:
  - `UserTable` - List of platform users
  - `UserFilter` - Search and filtering options
  - `UserEditor` - Edit user details and permissions
  - `UserStats` - User activity metrics
- **Connected To**: Admin Dashboard

### Content Management
- **Path**: `/admin/content`
- **File**: `app/admin/content/page.tsx`
- **Purpose**: Manage platform content
- **Key Components**:
  - `TemplateManager` - Legal document templates
  - `PageContentEditor` - Public page content
  - `LegalTermManager` - Legal terminology database
  - `ResourceLibrary` - Learning resources management
- **Connected To**: Admin Dashboard

### Lawyer Management
- **Path**: `/admin/lawyers`
- **File**: `app/admin/lawyers/page.tsx`
- **Purpose**: Manage lawyer profiles and verification
- **Key Components**:
  - `LawyerTable` - List of platform lawyers
  - `VerificationQueue` - Pending verification requests
  - `LawyerEditor` - Edit lawyer profile information
  - `PerformanceMetrics` - Lawyer activity statistics
- **Connected To**: Admin Dashboard

### Billing Admin
- **Path**: `/admin/billing`
- **File**: `app/admin/billing/page.tsx`
- **Purpose**: Manage payments and subscriptions
- **Key Components**:
  - `TransactionLog` - Payment transaction history
  - `SubscriptionManager` - User subscription management
  - `RevenueDashboard` - Financial performance metrics
  - `PlanEditor` - Edit subscription plans
- **Connected To**: Admin Dashboard

## Utility Pages

### Search Results
- **Path**: `/search`
- **File**: `app/search/page.tsx`
- **Purpose**: Display global search results
- **Key Components**:
  - `SearchBar` - Search input interface
  - `ResultTabs` - Categorized search results
  - `DocumentResults` - Matching documents
  - `LawyerResults` - Matching lawyer profiles
  - `ChatResults` - Relevant chat conversations
- **Connected To**: Various pages based on results

### Billing and Payments
- **Path**: `/billing`
- **File**: `app/billing/page.tsx`
- **Purpose**: Manage subscription and payment information
- **Key Components**:
  - `SubscriptionInfo` - Current plan details
  - `PlanSelector` - Upgrade/downgrade options
  - `PaymentMethodManager` - Credit card management
  - `InvoiceHistory` - Past payment records
- **Connected To**: Dashboard, Checkout, Payments

### Checkout Page
- **Path**: `/checkout`
- **File**: `app/checkout/page.tsx`
- **Purpose**: Process payments for plans or services
- **Key Components**:
  - `OrderSummary` - Purchase details
  - `PaymentForm` - Payment method entry
  - `DiscountCode` - Promo code application
  - `CheckoutStepper` - Multi-step checkout process
- **Connected To**: Billing, Success/Failure pages

### Payment History
- **Path**: `/payments`
- **File**: `app/payments/page.tsx`
- **Purpose**: View payment transaction history
- **Key Components**:
  - `TransactionTable` - List of payment transactions
  - `TransactionFilter` - Filter by date, amount, type
  - `ReceiptDownload` - Download payment receipts
- **Connected To**: Billing, Dashboard

### Learning Resources
- **Path**: `/learn`
- **File**: `app/learn/page.tsx`
- **Purpose**: Educational content about legal topics
- **Key Components**:
  - `ArticleLibrary` - Educational articles
  - `VideoTutorials` - Instructional videos
  - `GlossarySearch` - Legal terminology lookup
  - `ResourceFilter` - Filter by topic, type, etc.
- **Connected To**: Dashboard, Research

### Legal Research
- **Path**: `/research`
- **File**: `app/research/page.tsx`
- **Purpose**: Legal research tools and resources
- **Key Components**:
  - `SearchInterface` - Advanced legal search
  - `CaseFinder` - Legal case database
  - `StatuteBrowser` - Laws and regulations lookup
  - `SavedSearches` - User's previous searches
- **Connected To**: Dashboard, Learn

### Error Pages
- **404 Page**: `app/not-found.tsx`
- **500 Page**: `app/error.tsx`
- **Unauthorized Page**: `app/unauthorized/page.tsx`
- **Purpose**: Handle various error conditions gracefully
- **Key Components**:
  - `ErrorMessage` - Friendly error explanation
  - `SuggestionLinks` - Alternative navigation options
  - `SupportContact` - Help contact information
- **Connected To**: Home, Dashboard (if authenticated) 