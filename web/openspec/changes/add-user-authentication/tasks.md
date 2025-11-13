# Implementation Tasks: Add User Authentication System

## 1. Database Implementation
- [ ] 1.1 Create database connection configuration in config/database.go
- [ ] 1.2 Define User struct with authentication fields (id, email, password_hash, otp_secret, otp_verified, otp_enabled, is_active, is_admin)
- [ ] 1.3 Implement CreateUser() method for registration
- [ ] 1.4 Implement GetUserByEmail() method for login validation
- [ ] 1.5 Implement GetUserByID() method for user lookup
- [ ] 1.6 Implement UpdateUserOTPVerified() method
- [ ] 1.7 Create database initialization script (CREATE TABLE users)
- [ ] 1.8 Add index on email field for performance
- [ ] 1.9 Test database operations

## 2. Authentication Utilities (auth/auth.go)
- [ ] 2.1 Implement HashPassword() using bcrypt
- [ ] 2.2 Implement CheckPassword() for validation
- [ ] 2.3 Implement GenerateJWT() with user ID and email claims
- [ ] 2.4 Implement ValidateJWT() for token verification
- [ ] 2.5 Implement GenerateOTPSecret() using Base32 encoding
- [ ] 2.6 Implement ValidateOTP() using TOTP algorithm
- [ ] 2.7 Implement GetOTPQRCodeURL() for Google Authenticator setup
- [ ] 2.8 Implement GenerateUUID() for user IDs
- [ ] 2.9 Add email validation utility
- [ ] 2.10 Add password strength validation
- [ ] 2.11 Write unit tests for all auth functions

## 3. Backend API Endpoints (api/server.go)
- [ ] 3.1 Implement handleRegister() endpoint
  - [ ] Validate email format and password strength
  - [ ] Check for duplicate email
  - [ ] Generate user ID and password hash
  - [ ] Generate OTP secret
  - [ ] Create user in database
  - [ ] Return QR code URL and user info
- [ ] 3.2 Implement handleLogin() endpoint
  - [ ] Validate request body
  - [ ] Lookup user by email
  - [ ] Verify password
  - [ ] Check OTP status
  - [ ] Return requires_otp flag or JWT token
- [ ] 3.3 Implement handleVerifyOTP() endpoint
  - [ ] Validate user ID and OTP code
  - [ ] Verify OTP using TOTP
  - [ ] Mark OTP as verified
  - [ ] Generate JWT token
  - [ ] Return token and user info
- [ ] 3.4 Implement handleCompleteRegistration() endpoint
  - [ ] Similar to verifyOTP but for new registrations
- [ ] 3.5 Register routes in API group
- [ ] 3.6 Add error handling and logging
- [ ] 3.7 Test all endpoints with curl/Postman

## 4. Frontend Integration
- [ ] 4.1 Update AuthContext.login() to call POST /api/login
- [ ] 4.2 Update AuthContext.verifyOTP() to call POST /api/verify-otp
- [ ] 4.3 Update AuthContext.register() to call POST /api/register
- [ ] 4.4 Handle authentication state in useEffect
- [ ] 4.5 Test login flow with backend
- [ ] 4.6 Test OTP verification flow
- [ ] 4.7 Test token persistence across page refreshes
- [ ] 4.8 Implement protected route logic
- [ ] 4.9 Add logout functionality
- [ ] 4.10 Handle authentication errors gracefully

## 5. Database Initialization and Migration
- [ ] 5.1 Create database file (nofx.db)
- [ ] 5.2 Run CREATE TABLE script
- [ ] 5.3 Verify table structure
- [ ] 5.4 Create test user for development
- [ ] 5.5 Document setup process in README

## 6. Testing and Validation
- [ ] 6.1 Write unit tests for database operations
- [ ] 6.2 Write unit tests for auth utilities
- [ ] 6.3 Write integration tests for API endpoints
- [ ] 6.4 Test complete user registration flow
- [ ] 6.5 Test login with OTP
- [ ] 6.6 Test login without OTP
- [ ] 6.7 Test invalid credentials
- [ ] 6.8 Test invalid OTP codes
- [ ] 6.9 Test token expiration handling
- [ ] 6.10 Frontend E2E tests for login page

## 7. Rate Limiting Implementation
- [ ] 7.1 Design rate limiting strategy (token bucket or sliding window)
- [ ] 7.2 Implement rate limiter middleware
- [ ] 7.3 Configure rate limits: max 5 login attempts per 15 minutes per IP
- [ ] 7.4 Implement rate limit tracking in database or cache
- [ ] 7.5 Return HTTP 429 with Retry-After header on rate limit exceeded
- [ ] 7.6 Test rate limiting with load testing
- [ ] 7.7 Add rate limit headers to responses (X-RateLimit-Remaining, X-RateLimit-Reset)

## 8. Account Lockout Mechanism
- [ ] 8.1 Add lockout fields to User struct (locked_until, failed_attempts, last_failed_at)
- [ ] 8.2 Implement failed login attempt tracking
- [ ] 8.3 Lock account after 5 consecutive failed attempts
- [ ] 8.4 Set lockout duration to 30 minutes
- [ ] 8.5 Reset failed_attempts counter on successful login
- [ ] 8.6 Return clear error message when account is locked
- [ ] 8.7 Implement unlock mechanism (automatic unlock after timeout)
- [ ] 8.8 Add admin endpoint to manually unlock account (optional)

## 9. Password Reset Flow
- [ ] 9.1 Design password reset token mechanism (secure random tokens)
- [ ] 9.2 Implement handleRequestPasswordReset() endpoint
- [ ] 9.3 Implement handleResetPassword() endpoint
- [ ] 9.4 Generate secure reset tokens with expiration (1 hour)
- [ ] 9.5 Store reset tokens in database (password_resets table)
- [ ] 9.6 Implement email sending for reset notifications
- [ ] 9.7 Validate reset token format and expiration
- [ ] 9.8 Require OTP verification to complete password reset
- [ ] 9.9 Invalidate all reset tokens after successful password change
- [ ] 9.10 Frontend: Add "Forgot Password" link on login page
- [ ] 9.11 Frontend: Create password reset request page
- [ ] 9.12 Frontend: Create password reset confirmation page
- [ ] 9.13 Frontend: Add password confirmation and OTP fields
- [ ] 9.14 Test complete password reset flow end-to-end

## 10. OTP Mandatory Enforcement
- [ ] 10.1 Update registration flow to require OTP setup
- [ ] 10.2 Update login flow to always require OTP verification
- [ ] 10.3 Remove optional OTP flags from user interface
- [ ] 10.4 Update database schema if needed (remove otp_enabled, keep otp_verified)
- [ ] 10.5 Ensure all existing flows assume OTP is required
- [ ] 10.6 Update error messages to reflect mandatory OTP requirement

## 11. Enhanced User Schema
- [ ] 11.1 Add fields: locked_until (DATETIME), failed_attempts (INT), last_failed_at (DATETIME)
- [ ] 11.2 Add password_resets table: id, user_id, token_hash, expires_at, used_at
- [ ] 11.3 Add login_attempts table for audit trail: id, user_id, ip_address, timestamp, success (optional)
- [ ] 11.4 Create indexes on new fields for performance
- [ ] 11.5 Write migration script for existing users
- [ ] 11.6 Test schema changes with sample data

## 12. Email Service Integration
- [ ] 12.1 Choose email service provider (SendGrid, AWS SES, or SMTP)
- [ ] 12.2 Implement email template for password reset
- [ ] 12.3 Create email sending utility function
- [ ] 12.4 Handle email delivery failures gracefully
- [ ] 12.5 Add email sending to password reset flow
- [ ] 12.6 Test email delivery (check spam folder, format, links)

## 13. Documentation
- [ ] 13.1 Document API endpoints in OpenAPI/Swagger format
- [ ] 13.2 Update project README with setup instructions
- [ ] 13.3 Document database schema
- [ ] 13.4 Add authentication flow diagrams
- [ ] 13.5 Document environment variables (JWT_SECRET, EMAIL_SERVICE, etc.)
- [ ] 13.6 Document rate limiting configuration
- [ ] 13.7 Document account lockout behavior
- [ ] 13.8 Document password reset process for users

## 14. Security Hardening
- [ ] 14.1 Add security headers (CORS, CSRF protection)
- [ ] 14.2 Audit for SQL injection vulnerabilities
- [ ] 14.3 Audit for XSS vulnerabilities
- [ ] 14.4 Validate all inputs (email format, password strength, OTP format)
- [ ] 14.5 Implement HTTPS enforcement
- [ ] 14.6 Add request logging for security events
- [ ] 14.7 Implement audit trail for sensitive operations

## Notes
- Some frontend components (LoginPage.tsx, AuthContext.tsx) already exist and only need backend integration
- Use existing project conventions: Gin for Go backend, React for frontend
- Follow existing code style and patterns
- Ensure all new code passes linting and type checking
