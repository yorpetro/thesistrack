# Google Authentication Setup Guide

## Overview
Google OAuth authentication has been successfully implemented for ThesisTrack. New users signing in with Google are automatically registered as **Students**.

## Configuration Changes Made

### 1. Environment Configuration
- **Backend**: Updated to read `.env` file from project root directory
- **Frontend**: Updated Vite config to read environment variables from root directory
- **Global .env**: Create a single `.env` file in the project root for all configuration

### 2. Backend Changes
- Added Google OAuth endpoint: `POST /api/v1/auth/google`
- New Google users are automatically assigned the "student" role
- Existing users can link their Google account
- Enhanced token verification and user creation flow

### 3. Frontend Changes
- Added GoogleSignInButton component
- Updated Login and Register pages with Google Sign In
- Removed role selection modal (automatic student assignment)
- Simplified authentication flow

## Setup Instructions

### 1. Create Root Environment File
Create a `.env` file in the project root (`/thesistrack/.env`) with:

```env
# Database Configuration
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=thesistrack

# Security
SECRET_KEY=your-secret-key-here-change-in-production

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-email-password
EMAILS_FROM_EMAIL=your-email@gmail.com
EMAILS_FROM_NAME=ThesisTrack

# Environment
ENVIRONMENT=development

# Frontend Configuration (Vite will use GOOGLE_CLIENT_ID automatically)
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

### 2. Google Cloud Console Setup

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "ThesisTrack"

#### Step 2: Enable APIs
1. Go to "APIs & Services" → "Library"
2. Enable "Google+ API" or "Google Identity Services"

#### Step 3: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in:
   - **App name**: ThesisTrack
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes: `userinfo.email`, `userinfo.profile`, `openid`

#### Step 4: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Create "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - `http://localhost:3000`
   - Your production domain
5. Add **Authorized redirect URIs**:
   - `http://localhost:5173`
   - Your production domain

#### Step 5: Update Environment Variables
Copy the Client ID and Client Secret to your `.env` file.

### 3. Testing the Setup

1. **Build containers**: `docker-compose build`
2. **Start services**: `docker-compose up -d`
3. **Verify status**: `docker-compose ps`
4. **Test frontend**: Visit `http://localhost:5173`
5. **Test backend**: Visit `http://localhost:8000/docs`
6. **Clean up**: `docker-compose down`

## Features

### Authentication Flow
1. User clicks "Sign in with Google"
2. Google authentication popup appears
3. User selects Google account and grants permissions
4. Backend receives and verifies Google ID token
5. New users are automatically created with "student" role
6. JWT token is issued for session management
7. User is redirected to dashboard

### Security Features
- Token verification against Google's API
- Audience validation (client ID verification)
- Automatic student role assignment for new users
- Integration with existing JWT authentication system
- OAuth users have no password (secure by design)

### User Experience
- Seamless single-click authentication
- No role selection required (automatic student assignment)
- Existing users can link Google accounts
- Consistent UI across login and registration pages

## Important Notes

- **Client ID**: Safe to expose in frontend code
- **Client Secret**: Must remain secure, never expose in frontend
- **Default Role**: All new Google users are created as students
- **Role Changes**: Admins can change user roles after registration
- **Account Linking**: Users with same email can link Google to existing accounts

## Troubleshooting

### Common Issues
1. **Invalid Client ID**: Verify GOOGLE_CLIENT_ID in .env matches Google Console
2. **CORS Errors**: Ensure authorized origins include your domain
3. **Token Verification Failed**: Check GOOGLE_CLIENT_SECRET is correct
4. **Environment Variables**: Ensure .env file is in project root

### Verification Steps
1. Check Google Console configuration
2. Verify environment variables are loaded
3. Test with Docker containers as shown above
4. Check browser console for JavaScript errors
5. Review backend logs for authentication errors

The implementation is complete and ready for use! 🎉
