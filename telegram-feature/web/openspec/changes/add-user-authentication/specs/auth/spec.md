# OpenSpec Delta: User Authentication Capability

## ADDED Requirements
### Requirement: User Registration
The system SHALL allow users to register with email and password to create a new account.

#### Scenario: Successful registration
- **WHEN** user provides valid email and password
- **AND** email is not already registered
- **THEN** create user account with hashed password
- **AND** generate OTP secret for two-factor authentication
- **AND** return user ID and QR code URL for OTP setup
- **AND** user account is saved to database

#### Scenario: Duplicate email registration
- **WHEN** user provides email that already exists
- **THEN** return error message "邮箱已被注册"
- **AND** no new account is created

#### Scenario: Invalid email format
- **WHEN** user provides email in invalid format
- **THEN** return error message "邮箱格式不正确"
- **AND** no account creation is attempted

#### Scenario: Weak password
- **WHEN** user provides password with less than 8 characters
- **THEN** return error message "密码强度不足（至少8位）"
- **AND** no account creation is attempted

### Requirement: User Login
The system SHALL allow registered users to authenticate using email and password.

#### Scenario: Successful login with OTP enabled
- **WHEN** valid email and password are provided
- **AND** user has OTP enabled but not yet verified
- **THEN** return response with requires_otp: true
- **AND** return user_id for subsequent OTP verification
- **AND** do not return JWT token yet

#### Scenario: Successful login without OTP
- **WHEN** valid email and password are provided
- **AND** user does not have OTP enabled OR OTP is already verified
- **THEN** return JWT token
- **AND** return user_id and email
- **AND** user session is established

#### Scenario: Invalid credentials
- **WHEN** email or password is incorrect
- **THEN** return error message "邮箱或密码错误"
- **AND** do not return authentication token

#### Scenario: Login with unverified OTP
- **WHEN** user has OTP enabled but never verified
- **THEN** require OTP verification before login completion
- **AND** prevent token generation until OTP is verified

#### Scenario: Mandatory OTP for all users
- **WHEN** user attempts to register
- **THEN** generate OTP secret during registration
- **AND** require OTP verification before account is active
- **AND** prevent login without OTP verification
- **AND** user cannot disable OTP

### Requirement: Two-Factor Authentication (OTP)
The system SHALL support time-based one-time passwords (TOTP) for enhanced security.

#### Scenario: OTP generation during registration
- **WHEN** new user registers successfully
- **THEN** generate 32-character Base32 encoded OTP secret
- **AND** provide QR code URL for Google Authenticator
- **AND** otp_verified flag is set to false initially

#### Scenario: OTP verification during login
- **WHEN** valid user_id and 6-digit OTP code are provided
- **AND** OTP code matches the secret for that user
- **THEN** mark user's OTP as verified
- **AND** generate and return JWT token
- **AND** user session is established

#### Scenario: Invalid OTP code
- **WHEN** user provides incorrect OTP code
- **THEN** return error message "验证码错误"
- **AND** do not mark OTP as verified
- **AND** do not generate JWT token

#### Scenario: OTP code format validation
- **WHEN** user provides non-numeric or wrong-length OTP code
- **THEN** validate format (6 digits only)
- **AND** reject invalid format with appropriate error

### Requirement: JWT Token Generation
The system SHALL generate and validate JWT tokens for authenticated sessions.

#### Scenario: Token generation on successful authentication
- **WHEN** user successfully authenticates (with or without OTP)
- **THEN** generate JWT token signed with HS256 algorithm
- **AND** include user_id and email claims
- **AND** set expiration to 7 days from creation
- **AND** return token as string to client

#### Scenario: Token validation on protected routes
- **WHEN** client sends request with Bearer token
- **THEN** validate token signature using secret key
- **AND** check token expiration
- **AND** reject if token is expired or invalid
- **AND** allow access if token is valid

#### Scenario: Token expiration
- **WHEN** JWT token has expired
- **THEN** return 401 Unauthorized
- **AND** require user to re-authenticate

### Requirement: Password Security
The system SHALL securely hash and verify passwords using bcrypt.

#### Scenario: Password hashing
- **WHEN** user sets password during registration
- **THEN** hash password using bcrypt with cost factor 12
- **AND** store only the hash, never the plain password
- **AND** hash cannot be reversed to original password

#### Scenario: Password verification
- **WHEN** user attempts login with password
- **THEN** compare provided password against stored hash using bcrypt
- **AND** return match result without revealing password

#### Scenario: Password strength validation
- **WHEN** user attempts to set password
- **THEN** enforce minimum length of 8 characters
- **AND** reject passwords that are too short

### Requirement: Session Management
The system SHALL manage user sessions using token storage in localStorage.

#### Scenario: Session persistence
- **WHEN** user successfully authenticates
- **THEN** store JWT token in localStorage under key 'auth_token'
- **AND** store user info (id, email) in localStorage under key 'auth_user'
- **AND** maintain session across page refreshes

#### Scenario: Session restoration
- **WHEN** user loads application
- **THEN** check localStorage for existing token and user info
- **AND** restore authentication state if valid token exists
- **AND** auto-login user if token is still valid

#### Scenario: Logout
- **WHEN** user initiates logout
- **THEN** clear 'auth_token' from localStorage
- **AND** clear 'auth_user' from localStorage
- **AND** set user state to null
- **AND** redirect to login page

### Requirement: Authentication State Management
The system SHALL provide global authentication context for React components.

#### Context: React AuthContext Integration
- **WHEN** AuthProvider component mounts
- **THEN** check for existing token in localStorage
- **AND** validate token with backend if present
- **AND** set initial user and token state

- **WHEN** login() method is called
- **THEN** call POST /api/login with email and password
- **AND** handle response (success/failure/requires_otp)
- **AND** update user and token state on success

- **WHEN** verifyOTP() method is called
- **THEN** call POST /api/verify-otp with user_id and otp_code
- **AND** handle response
- **AND** update state and redirect on success

- **WHEN** logout() method is called
- **THEN** clear all authentication state
- **AND** redirect to login page

### Requirement: Rate Limiting
The system SHALL implement rate limiting to prevent brute force attacks on authentication endpoints.

#### Scenario: Rate limit exceeded
- **WHEN** user makes more than 5 login attempts within 15 minutes
- **THEN** return HTTP 429 Too Many Requests
- **AND** include Retry-After header with wait time
- **AND** return error message: "登录尝试过于频繁，请稍后再试"
- **AND** block further attempts until cooldown period expires

#### Scenario: Rate limit tracking per IP
- **GIVEN** multiple users from same IP address
- **WHEN** login attempts are made
- **THEN** rate limiting applies per IP address
- **AND** each IP has independent rate limit counter
- **AND** blocking one user does not affect other users from same IP

#### Scenario: Rate limit headers
- **GIVEN** successful or failed authentication request
- **WHEN** response is sent
- **THEN** include X-RateLimit-Remaining header
- **AND** include X-RateLimit-Reset header
- **AND** include X-RateLimit-Limit header (showing max attempts)

#### Scenario: Rate limit reset
- **WHEN** 15 minutes have passed since first failed attempt
- **THEN** reset attempt counter to 0
- **AND** allow user to attempt login again
- **AND** counter continues to track new attempts

### Requirement: Account Lockout
The system SHALL lock user accounts after multiple consecutive failed login attempts.

#### Scenario: Account lockout after failed attempts
- **WHEN** user has 5 consecutive failed login attempts
- **THEN** lock user account
- **AND** set locked_until timestamp to 30 minutes in future
- **AND** increment failed_attempts counter
- **AND** record last_failed_at timestamp

#### Scenario: Locked account login attempt
- **WHEN** locked user attempts to login
- **AND** account is currently locked (locked_until > now)
- **THEN** return HTTP 423 Locked
- **AND** return error message: "账户已被锁定，请于{unlock_time}后重试"
- **AND** include unlock timestamp in response
- **AND** prevent any authentication attempt

#### Scenario: Account auto-unlock
- **WHEN** locked user's lockout period expires
- **AND** locked_until timestamp has passed
- **THEN** automatically unlock account
- **AND** reset failed_attempts to 0
- **AND** clear locked_until timestamp
- **AND** allow user to attempt login again

#### Scenario: Successful login resets counter
- **WHEN** user successfully logs in
- **THEN** reset failed_attempts counter to 0
- **AND** clear locked_until timestamp
- **AND** clear last_failed_at timestamp
- **AND** account remains unlocked

### Requirement: Password Reset
The system SHALL allow users to reset their password via secure email-based flow.

#### Scenario: Request password reset
- **WHEN** user requests password reset
- **THEN** generate secure random reset token
- **AND** set token expiration to 1 hour
- **AND** store hashed token in database
- **AND** send email with reset link to user's email
- **AND** return success message without revealing if email exists

#### Scenario: Password reset email
- **GIVEN** user has requested password reset
- **WHEN** email is sent
- **THEN** include secure reset link with token
- **AND** include clear instructions
- **AND** link expires after 1 hour
- **AND** email is only sent if account exists

#### Scenario: Valid password reset
- **WHEN** user clicks reset link and provides new password
- **AND** token is valid and not expired
- **THEN** validate new password strength
- **AND** hash new password with bcrypt
- **AND** update user's password_hash
- **AND** invalidate all existing reset tokens
- **AND** require OTP verification to complete reset
- **AND** return success message

#### Scenario: Invalid or expired reset token
- **WHEN** user attempts to reset with invalid token
- **OR** token has expired
- **THEN** return HTTP 400 Bad Request
- **AND** return error message: "重置链接无效或已过期"
- **AND** require user to request new reset link

#### Scenario: Password reset requires OTP
- **WHEN** user completes password reset with valid token
- **THEN** require OTP verification
- **AND** user must provide 6-digit OTP code
- **AND** verify OTP before updating password
- **AND** only update password if OTP is valid

#### Scenario: Multiple reset token invalidation
- **WHEN** user successfully resets password
- **THEN** invalidate ALL existing reset tokens for that user
- **AND** prevent reuse of any previous tokens
- **AND** generate fresh token for any future resets
