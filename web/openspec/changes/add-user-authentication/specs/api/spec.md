# OpenSpec Delta: Authentication API Endpoints

## ADDED Requirements
### Requirement: POST /api/register
The API SHALL provide an endpoint for user registration with email and password.

#### Scenario: Successful registration
- **WHEN** POST request to /api/register with valid email and password
- **AND** email is not already registered
- **THEN** return HTTP 200
- **AND** return JSON with user_id, email, otp_secret, qr_code_url, and message
- **AND** user account is created in database with hashed password

#### Scenario: Registration with beta code
- **WHEN** POST request includes beta_code field
- **THEN** save beta_code to user record
- **AND** validate beta code if required by system

#### Scenario: Duplicate email error
- **WHEN** POST request with email that already exists
- **THEN** return HTTP 409 Conflict
- **AND** return JSON with error field: "邮箱已被注册"

#### Scenario: Invalid email format
- **WHEN** POST request with malformed email
- **THEN** return HTTP 400 Bad Request
- **AND** return JSON with error field: "邮箱格式不正确"

#### Scenario: Weak password
- **WHEN** POST request with password shorter than 8 characters
- **THEN** return HTTP 400 Bad Request
- **AND** return JSON with error field: "密码强度不足（至少8位）"

#### Scenario: Server error during registration
- **WHEN** database operation fails
- **THEN** return HTTP 500 Internal Server Error
- **AND** return JSON with error field: "创建用户失败"

### Requirement: POST /api/login
The API SHALL provide an endpoint for user authentication with email and password.

#### Scenario: Login requires OTP verification
- **WHEN** POST request with valid credentials
- **AND** user has OTP enabled but not verified
- **THEN** return HTTP 200
- **AND** return JSON with requires_otp: true, user_id, and message
- **AND** do not include token in response

#### Scenario: Login successful without OTP
- **WHEN** POST request with valid credentials
- **AND** user does not require OTP verification
- **THEN** return HTTP 200
- **AND** return JSON with requires_otp: false, token, user_id, email, and message
- **AND** JWT token is valid for authenticated requests

#### Scenario: Invalid email
- **WHEN** POST request with email not found in database
- **THEN** return HTTP 401 Unauthorized
- **AND** return JSON with error field: "邮箱或密码错误"

#### Scenario: Incorrect password
- **WHEN** POST request with correct email but wrong password
- **THEN** return HTTP 401 Unauthorized
- **AND** return JSON with error field: "邮箱或密码错误"

#### Scenario: Missing required fields
- **WHEN** POST request missing email or password
- **THEN** return HTTP 400 Bad Request
- **AND** return JSON with validation error details

### Requirement: POST /api/verify-otp
The API SHALL provide an endpoint for OTP verification to complete authentication.

#### Scenario: OTP verification successful
- **WHEN** POST request with valid user_id and 6-digit OTP code
- **AND** OTP code matches user's secret
- **THEN** return HTTP 200
- **AND** update user's otp_verified flag to true
- **AND** return JSON with token, user_id, email, and message
- **AND** user can now use token for authenticated requests

#### Scenario: Invalid OTP code
- **WHEN** POST request with incorrect OTP code
- **THEN** return HTTP 401 Unauthorized
- **AND** return JSON with error field: "验证码错误"
- **AND** do not mark OTP as verified

#### Scenario: User not found
- **WHEN** POST request with non-existent user_id
- **THEN** return HTTP 401 Unauthorized
- **AND** return JSON with error field: "用户不存在"

#### Scenario: Invalid OTP format
- **WHEN** POST request with OTP code that is not 6 digits
- **THEN** return HTTP 400 Bad Request
- **AND** return JSON with validation error

### Requirement: POST /api/complete-registration
The API SHALL provide an endpoint to complete registration after OTP verification.

#### Scenario: Registration completion successful
- **WHEN** POST request with valid user_id and OTP code for new user
- **AND** OTP code matches user's secret
- **THEN** return HTTP 200
- **AND** update user's otp_verified flag to true
- **AND** generate and return JWT token
- **AND** user is automatically logged in

#### Scenario: Registration already completed
- **WHEN** POST request for user who already completed registration
- **THEN** return HTTP 400 Bad Request
- **AND** return JSON with appropriate error message

### Requirement: Request Format Validation
All authentication endpoints SHALL validate request format and content.

#### Scenario: Valid JSON body
- **WHEN** POST request has valid JSON body with required fields
- **THEN** proceed with authentication logic
- **AND** process request normally

#### Scenario: Invalid JSON body
- **WHEN** POST request has malformed JSON
- **THEN** return HTTP 400 Bad Request
- **AND** return JSON with error field describing the issue

#### Scenario: Missing content-type header
- **WHEN** POST request without Content-Type: application/json
- **THEN** return HTTP 400 Bad Request
- **AND** return JSON with error: "Content-Type must be application/json"

### Requirement: Response Format Standardization
All authentication endpoints SHALL return consistent JSON responses.

#### Success Response Format
- **GIVEN** successful authentication request
- **WHEN** processing completes
- **THEN** return HTTP status 200 or appropriate success code
- **AND** return JSON with fields: success indicator, data, message

#### Error Response Format
- **GIVEN** failed authentication request
- **WHEN** error is encountered
- **THEN** return appropriate HTTP error status (400, 401, 409, 500)
- **AND** return JSON with single "error" field containing description

### Requirement: Authentication Middleware Integration
The API SHALL integrate with authentication middleware for protected endpoints.

#### Scenario: Protected endpoint access
- **WHEN** client sends request to protected endpoint with valid Bearer token
- **THEN** middleware validates token
- **AND** request proceeds to handler
- **AND** handler has access to user claims from token

#### Scenario: Protected endpoint without token
- **WHEN** client sends request to protected endpoint without Authorization header
- **THEN** middleware returns HTTP 401 Unauthorized
- **AND** request does not reach handler

#### Scenario: Protected endpoint with invalid token
- **WHEN** client sends request with invalid or expired token
- **THEN** middleware returns HTTP 401 Unauthorized
- **AND** include error message about token validity

### Requirement: POST /api/request-password-reset
The API SHALL provide an endpoint to initiate password reset process.

#### Scenario: Successful reset request
- **WHEN** POST request with valid email address
- **THEN** return HTTP 200
- **AND** return JSON with message field
- **AND** generate secure reset token
- **AND** store token with 1-hour expiration
- **AND** send email with reset link

#### Scenario: Reset request for non-existent email
- **WHEN** POST request with email not in database
- **THEN** return HTTP 200 (same as success)
- **AND** return generic success message
- **AND** do not reveal if email exists
- **AND** do not send email (no user found)

#### Scenario: Reset request rate limiting
- **WHEN** user requests password reset multiple times
- **THEN** apply rate limiting (max 3 requests per hour)
- **AND** return HTTP 429 if exceeded
- **AND** return error: "请求过于频繁，请稍后再试"

### Requirement: POST /api/reset-password
The API SHALL provide an endpoint to complete password reset with token and new password.

#### Scenario: Successful password reset
- **WHEN** POST request with valid token and new password
- **AND** token has not expired
- **AND** user provides valid OTP
- **THEN** return HTTP 200
- **AND** update user's password_hash
- **AND** invalidate all reset tokens for user
- **AND** return JSON with success message

#### Scenario: Invalid reset token
- **WHEN** POST request with invalid token
- **THEN** return HTTP 400 Bad Request
- **AND** return JSON with error field: "重置链接无效或已过期"

#### Scenario: Expired reset token
- **WHEN** POST request with expired token
- **THEN** return HTTP 400 Bad Request
- **AND** return JSON with error field: "重置链接已过期，请重新请求"

#### Scenario: Weak password during reset
- **WHEN** POST request with password shorter than 8 characters
- **THEN** return HTTP 400 Bad Request
- **AND** return JSON with error field: "密码强度不足（至少8位）"

#### Scenario: OTP required for password reset
- **WHEN** POST request without OTP code
- **THEN** return HTTP 400 Bad Request
- **AND** return JSON with error field: "验证码不能为空"

#### Scenario: Invalid OTP during password reset
- **WHEN** POST request with incorrect OTP code
- **THEN** return HTTP 401 Unauthorized
- **AND** return JSON with error field: "验证码错误"
- **AND** do not update password

### Requirement: Rate Limiting Headers
The API SHALL include rate limiting information in response headers.

#### Scenario: Rate limit headers on all responses
- **WHEN** any authentication endpoint is called
- **THEN** include X-RateLimit-Limit header (value: 5)
- **AND** include X-RateLimit-Remaining header (value: remaining attempts)
- **AND** include X-RateLimit-Reset header (timestamp when reset)

#### Scenario: Retry-After header on rate limit
- **WHEN** rate limit is exceeded
- **THEN** include Retry-After header with seconds to wait
- **AND** return HTTP 429 status
- **AND** include error message in response body

### Requirement: Account Lockout Response
The API SHALL provide clear error responses for locked accounts.

#### Scenario: Locked account error
- **WHEN** user attempts to login with locked account
- **AND** locked_until is in the future
- **THEN** return HTTP 423 Locked
- **AND** return JSON with error field and unlock time
- **AND** format: "账户已被锁定，请于{unlock_time}后重试"

#### Scenario: Account unlock after timeout
- **WHEN** locked user's lockout period has expired
- **AND** user attempts to login
- **THEN** allow login attempt
- **AND** reset failed_attempts counter
- **AND** clear locked_until timestamp
- **AND** proceed with normal authentication flow

### Requirement: Mandatory OTP for All Endpoints
All authentication endpoints SHALL require OTP verification where applicable.

#### Scenario: OTP verification on registration
- **WHEN** user completes registration
- **THEN** OTP must be verified before account is active
- **AND** user cannot login until OTP is verified
- **AND** return OTP setup instructions after registration

#### Scenario: OTP verification on password reset
- **WHEN** user completes password reset with valid token
- **THEN** OTP verification is mandatory
- **AND** password is only updated after OTP is validated
- **AND** prevent password change without OTP
