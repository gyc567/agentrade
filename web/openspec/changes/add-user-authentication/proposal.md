# OpenSpec Change Proposal: Add User Authentication System

## Why
Monnaire Trading Agent OS AI Trading System requires a secure user authentication system to protect user accounts and enable personalized features. The current system lacks login/logout capabilities, preventing users from accessing their trading accounts and AI trader configurations. This is a critical missing feature for any trading platform.

## What Changes

### Core Capabilities
- **User Authentication**: Implement email/password login with mandatory two-factor authentication (OTP)
- **Session Management**: Generate and validate JWT tokens for authenticated sessions
- **Security**: Implement password hashing (bcrypt) and OTP verification (TOTP)
- **Password Reset**: Allow users to reset password via email verification
- **Rate Limiting**: Implement login attempt rate limiting to prevent brute force attacks
- **Account Security**: Implement account lockout mechanism after multiple failed attempts
- **Database**: Create users table with proper schema for authentication data
- **API Endpoints**: Implement /api/login, /api/verify-otp, /api/register, /api/reset-password endpoints
- **Frontend**: Login page UI, password reset flow, and authentication state management via AuthContext

### Technical Implementation
- **Password Security**: bcrypt encryption with cost factor 12
- **Two-Factor Auth**: TOTP (Time-based One-Time Password) using Google Authenticator
- **Token Format**: JWT with HS256 algorithm, 7-day expiration
- **Session Storage**: localStorage for token persistence across browser sessions
- **Database**: SQLite with users table (id, email, password_hash, otp_secret, otp_verified, etc.)

### User Flow
1. User navigates to /login page
2. User enters email and password
3. Backend validates credentials and checks rate limits
4. If account is locked, display lockout message with unlock time
5. User must enter 6-digit OTP verification code (mandatory for all users)
6. Upon successful authentication, JWT token is returned
7. Frontend stores token and user info in localStorage
8. User is redirected to authenticated area
9. For password reset: user requests reset → receives email → clicks link → enters new password → confirms with OTP

## Impact

### Affected Capabilities
- **User Management**: Complete new authentication capability
- **Session State**: Authentication context and token management
- **API Security**: Protected routes require valid JWT tokens
- **Database Schema**: New users table and associated indexes
- **Frontend Routing**: Login/logout flow and protected route handling

### Affected Code
- **Backend**:
  - `/api/server.go` - New authentication endpoints
  - `auth/auth.go` - Password, JWT, and OTP utilities
  - `config/database.go` - User CRUD operations
- **Frontend**:
  - `src/components/LoginPage.tsx` - Login UI (already exists, needs backend integration)
  - `src/contexts/AuthContext.tsx` - Auth state management (already exists, needs backend integration)
  - `src/lib/api.ts` - API calls (already exists, needs backend integration)
  - `src/App.tsx` - Route protection

### Breaking Changes
None. This is a net-new feature.

### Dependencies
- Go dependencies: bcrypt, jwt-go, otp library
- Frontend dependencies: None (using existing React/SWR stack)

## Requirements Confirmation
✅ **Password Reset**: Included in this change - users can reset password via email verification
✅ **Rate Limiting**: Included - implement login attempt rate limiting (max 5 attempts per 15 minutes)
✅ **OTP Mandatory**: Confirmed - OTP is required for all users during registration and login
✅ **Account Lockout**: Included - lock account after 5 failed login attempts for 30 minutes

## Approval Required
This change requires approval before implementation begins.

---
**Change ID**: add-user-authentication-system
**Created**: 2025-11-13
**Status**: Proposed
