# OpenSpec Delta: Frontend Authentication Integration

## ADDED Requirements
### Requirement: Login Page UI
The frontend SHALL provide a complete login page UI with email/password and OTP verification steps.

#### Scenario: Login page displays correctly
- **WHEN** user navigates to /login route
- **THEN** display LoginPage component
- **AND** show email input field
- **AND** show password input field
- **AND** show login button
- **AND** show link to registration page
- **AND** use Monnaire Trading Agent OS branding and dark theme

#### Scenario: Form validation on submit
- **WHEN** user clicks login without entering email
- **THEN** prevent form submission
- **AND** show validation error for required field

- **WHEN** user enters invalid email format
- **THEN** prevent form submission
- **AND** show validation error for invalid email

- **WHEN** user enters password shorter than required
- **THEN** prevent form submission
- **AND** show validation error for password

#### Scenario: Login loading state
- **WHEN** user submits login form
- **THEN** set loading state to true
- **AND** disable submit button
- **AND** show loading indicator
- **AND** prevent duplicate submissions

#### Scenario: Login error display
- **WHEN** login API returns error
- **THEN** display error message in red alert box
- **AND** show user-friendly error text
- **AND** reset loading state
- **AND** allow user to retry

#### Scenario: OTP step display
- **WHEN** login response indicates requires_otp=true
- **THEN** switch to OTP input step
- **AND** hide email/password fields
- **AND** show 6-digit OTP input field
- **AND** show QR code instruction
- **AND** show back button to return to login step
- **AND** show verify OTP button

#### Scenario: OTP input validation
- **WHEN** user types in OTP field
- **THEN** restrict input to 6 digits only
- **AND** auto-format as user types
- **AND** prevent non-numeric characters

#### Scenario: OTP verification
- **WHEN** user enters 6-digit OTP and clicks verify
- **THEN** call verifyOTP API
- **AND** show loading state
- **AND** handle success/failure response
- **AND** redirect to home page on success

### Requirement: Registration Page Integration
The frontend SHALL integrate with registration endpoint for new user signups.

#### Scenario: Registration flow
- **GIVEN** user clicks "立即注册" link from login page
- **WHEN** navigation to /register occurs
- **THEN** display registration form
- **AND** allow user to complete registration

- **WHEN** registration API returns success
- **THEN** show OTP setup instructions
- **AND** display QR code for Google Authenticator
- **AND** allow user to verify OTP to complete registration

### Requirement: AuthContext State Management
The frontend SHALL use AuthContext to manage global authentication state.

#### Scenario: AuthContext initialization
- **WHEN** AuthProvider component mounts
- **THEN** check localStorage for existing auth_token
- **AND** if token exists, attempt to validate with backend
- **AND** set user and token state based on validation result
- **AND** if no token, initialize as not authenticated

#### Scenario: Login method
- **WHEN** login() is called with email and password
- **THEN** make POST request to /api/login
- **AND** handle requires_otp response
- **AND** if requires_otp, return success with requiresOTP flag
- **AND** if login succeeds without OTP, set user and token state
- **AND** save token and user to localStorage
- **AND** if login fails, return error message

#### Scenario: VerifyOTP method
- **WHEN** verifyOTP() is called with userID and otpCode
- **THEN** make POST request to /api/verify-otp
- **AND** handle success response
- **AND** on success, set user and token state
- **AND** save token and user to localStorage
- **AND** redirect to home page
- **AND** if verification fails, return error message

#### Scenario: Register method
- **WHEN** register() is called with email, password, betaCode
- **THEN** make POST request to /api/register
- **AND** handle success response
- **AND** return user_id, otp_secret, qr_code_url
- **AND** allow UI to display OTP setup instructions
- **AND** if registration fails, return error message

#### Scenario: Logout method
- **WHEN** logout() is called
- **THEN** clear user state (set to null)
- **AND** clear token state (set to null)
- **AND** remove auth_token from localStorage
- **AND** remove auth_user from localStorage
- **AND** redirect to login page

### Requirement: Token and User Persistence
The frontend SHALL persist authentication state across browser sessions.

#### Scenario: Session persistence
- **WHEN** user successfully authenticates
- **THEN** store JWT token in localStorage under 'auth_token'
- **AND** store user object (id, email) in localStorage under 'auth_user'
- **AND** both values persist across page refreshes
- **AND** both values persist across browser restarts

#### Scenario: Session restoration
- **WHEN** user returns to application (after closing browser)
- **THEN** AuthContext checks localStorage on mount
- **AND** if valid token exists, restore user and token state
- **AND** user appears as logged in without re-entering credentials

#### Scenario: Session invalidation
- **WHEN** token expires or becomes invalid
- **THEN** API requests will return 401 Unauthorized
- **AND** frontend clears invalid token from state
- **AND** frontend clears invalid token from localStorage
- **AND** user is redirected to login page

### Requirement: Protected Routes
The frontend SHALL protect authenticated routes and redirect unauthorized users.

#### Scenario: Access protected route when authenticated
- **WHEN** authenticated user navigates to protected route
- **THEN** allow access to route
- **AND** display protected content
- **AND** have access to user context and token

#### Scenario: Access protected route when not authenticated
- **WHEN** unauthenticated user tries to access protected route
- **THEN** redirect to /login page
- **AND** save intended destination
- **AND** after successful login, redirect to saved destination

#### Scenario: Access login page when already authenticated
- **WHEN** authenticated user navigates to /login
- **THEN** redirect to home page (/) or intended destination
- **AND** do not show login form

### Requirement: API Client Integration
The frontend SHALL integrate API calls with the authentication backend.

#### Scenario: Login API call
- **WHEN** login() is called
- **THEN** make POST request to `${API_BASE}/login`
- **AND** send headers: Content-Type: application/json
- **AND** send body: { email, password }
- **AND** parse JSON response
- **AND** return success/error based on response

#### Scenario: Verify OTP API call
- **WHEN** verifyOTP() is called
- **THEN** make POST request to `${API_BASE}/verify-otp`
- **AND** send headers: Content-Type: application/json
- **AND** send body: { user_id: userID, otp_code: otpCode }
- **AND** parse JSON response
- **AND** return success/error based on response

#### Scenario: Register API call
- **WHEN** register() is called
- **THEN** make POST request to `${API_BASE}/register`
- **AND** send headers: Content-Type: application/json
- **AND** send body: { email, password, beta_code? }
- **AND** parse JSON response
- **AND** return success/error based on response

### Requirement: Error Handling
The frontend SHALL provide clear error messages and handle edge cases.

#### Scenario: Network error during login
- **WHEN** network request fails (offline, timeout, server down)
- **THEN** display error message: "登录失败，请检查网络连接"
- **AND** reset loading state
- **AND** allow user to retry

#### Scenario: API error response
- **WHEN** API returns error status (400, 401, 500, etc.)
- **THEN** display error message from API response
- **AND** show user-friendly text (not raw technical errors)
- **AND** reset loading state

#### Scenario: Unexpected error
- **WHEN** unexpected error occurs during authentication
- **THEN** log error to console for debugging
- **AND** display generic error message to user
- **AND** reset loading state

### Requirement: Loading States and UX
The frontend SHALL provide smooth loading experiences during authentication.

#### Scenario: Show spinner during login
- **WHEN** login request is in progress
- **THEN** show spinner or loading animation
- **AND** disable form inputs
- **AND** disable submit button
- **AND** prevent form submission

#### Scenario: Show spinner during OTP verification
- **WHEN** OTP verification request is in progress
- **THEN** show spinner on verify button
- **AND** disable OTP input field
- **AND** prevent resubmission

#### Scenario: Success feedback
- **WHEN** authentication succeeds
- **THEN** briefly show success message (optional)
- **AND** smoothly transition to next page
- **AND** do not leave user on login page

### Requirement: Header Bar Authentication State
The frontend HeaderBar SHALL update based on authentication state.

#### Scenario: Show login button when not authenticated
- **GIVEN** user is not logged in
- **WHEN** HeaderBar renders
- **THEN** show "登录" button
- **AND** do not show user menu or logout

#### Scenario: Show user menu when authenticated
- **GIVEN** user is logged in
- **WHEN** HeaderBar renders
- **THEN** hide "登录" button
- **AND** show user email/name
- **AND** show logout button
- **AND** show profile/account menu

#### Scenario: Logout from header
- **WHEN** user clicks logout button
- **THEN** call logout() method
- **AND** clear authentication state
- **AND** redirect to login page
- **AND** update HeaderBar to show login button

### Requirement: Password Reset UI Flow
The frontend SHALL provide complete password reset interface and workflow.

#### Scenario: Forgot password link
- **GIVEN** user is on login page
- **WHEN** user clicks "忘记密码？" link
- **THEN** navigate to /reset-password request page
- **AND** show form to enter email address
- **AND** provide clear instructions

#### Scenario: Password reset request
- **WHEN** user enters email on reset request page
- **AND** clicks "发送重置链接" button
- **THEN** make POST request to /api/request-password-reset
- **AND** show loading state
- **AND** on success, show confirmation message
- **AND** instruct user to check email (even if email doesn't exist)

#### Scenario: Password reset email received
- **GIVEN** user receives password reset email
- **WHEN** user clicks link in email
- **THEN** navigate to /reset-password/confirm with token in URL
- **AND** show form with new password and confirm password fields
- **AND** show OTP input field (mandatory)
- **AND** provide clear instructions

#### Scenario: Password reset confirmation
- **WHEN** user fills reset form with new password and OTP
- **AND** clicks "重置密码" button
- **THEN** make POST request to /api/reset-password with token, password, and OTP
- **AND** show loading state
- **AND** on success, show success message
- **AND** redirect to login page after 3 seconds

#### Scenario: Password validation on reset
- **WHEN** user enters new password on reset page
- **AND** password is too short (< 8 characters)
- **THEN** show validation error
- **AND** prevent form submission

#### Scenario: Password confirmation mismatch
- **WHEN** user enters password and confirm password
- **AND** passwords don't match
- **THEN** show validation error
- **AND** prevent form submission

#### Scenario: Invalid reset token
- **WHEN** user navigates to reset page with invalid token
- **THEN** show error message: "重置链接无效或已过期"
- **AND** provide option to request new reset link
- **AND** disable form inputs

#### Scenario: Expired reset token
- **WHEN** user navigates to reset page with expired token
- **THEN** show error message: "重置链接已过期"
- **AND** provide option to request new reset link
- **AND** disable form inputs

### Requirement: Rate Limiting Feedback
The frontend SHALL provide clear feedback when rate limits are exceeded.

#### Scenario: Rate limit exceeded
- **WHEN** login API returns 429 Too Many Requests
- **THEN** display error message: "登录尝试过于频繁，请稍后再试"
- **AND** show countdown timer if Retry-After header is present
- **AND** disable login form for the duration
- **AND** prevent further attempts

#### Scenario: Rate limit headers display
- **GIVEN** any authentication request
- **WHEN** response includes rate limit headers
- **THEN** optionally display remaining attempts in UI
- **AND** show reset time (useful for debugging)

#### Scenario: Reset request rate limiting
- **WHEN** password reset request returns 429
- **THEN** show message: "请求过于频繁，请稍后再试"
- **AND** show when user can try again

### Requirement: Account Lockout UI
The frontend SHALL clearly indicate when account is locked.

#### Scenario: Account locked message
- **WHEN** login API returns 423 Locked
- **THEN** display error with unlock time: "账户已被锁定，请于{unlock_time}后重试"
- **AND** format unlock time in user-friendly format (e.g., "2025-11-13 12:30 PM")
- **AND** disable login form until unlock time
- **AND** show countdown timer to unlock

#### Scenario: Account auto-unlock handling
- **GIVEN** user waits for lockout to expire
- **WHEN** unlock time is reached
- **THEN** automatically enable login form
- **AND** clear error message
- **AND** allow user to attempt login again

### Requirement: Mandatory OTP Enforcement
The frontend SHALL enforce mandatory OTP for all users.

#### Scenario: Registration always requires OTP
- **WHEN** user completes registration
- **THEN** always show OTP setup instructions
- **AND** do not offer "skip OTP" option
- **AND** require OTP verification to activate account
- **AND** prevent login until OTP is verified

#### Scenario: Login always requires OTP
- **WHEN** user successfully enters correct password
- **THEN** always require OTP verification
- **AND** do not allow "login without OTP" option
- **AND** step cannot be skipped

#### Scenario: Password reset requires OTP
- **WHEN** user completes password reset with valid token
- **THEN** always require OTP verification
- **AND** cannot complete reset without OTP
- **AND** OTP is mandatory for password changes

### Requirement: Enhanced Error Messages
The frontend SHALL provide specific error messages for different failure scenarios.

#### Scenario: Specific login errors
- **WHEN** login fails due to invalid credentials
- **THEN** show: "邮箱或密码错误"
- **WHEN** login fails due to locked account
- **THEN** show lockout message with unlock time
- **WHEN** login fails due to rate limiting
- **THEN** show rate limit message

#### Scenario: Password reset specific errors
- **WHEN** password reset token is invalid
- **THEN** show: "重置链接无效或已过期"
- **WHEN** password reset token is expired
- **THEN** show: "重置链接已过期，请重新请求"
- **WHEN** password reset OTP is invalid
- **THEN** show: "验证码错误"
- **WHEN** password is too weak
- **THEN** show: "密码强度不足（至少8位）"

#### Scenario: Network error handling
- **WHEN** network request fails
- **THEN** show: "网络错误，请检查连接后重试"
- **AND** allow retry
- **WHEN** server is unavailable (5xx errors)
- **THEN** show: "服务器暂时不可用，请稍后重试"

### Requirement: Security Headers and Validation
The frontend SHALL implement proper security validations and display rate limit information.

#### Scenario: Display rate limit information
- **GIVEN** user is on authentication page
- **WHEN** API response includes rate limit headers
- **THEN** optionally display remaining attempts in developer tools or debug mode
- **AND** show reset timestamp for troubleshooting

#### Scenario: Input sanitization
- **WHEN** user enters data in any form field
- **THEN** sanitize input to prevent XSS
- **AND** validate email format before sending
- **AND** validate password length before submitting

#### Scenario: Secure token handling
- **WHEN** handling reset tokens
- **THEN** never log token in console
- **AND** use token only for API requests
- **AND** clear token from URL after use
- **AND** never store reset tokens in localStorage

### Requirement: Email Validation on Frontend
The frontend SHALL validate email format before making API calls.

#### Scenario: Email format validation
- **WHEN** user types in email field
- **THEN** validate email format using regex
- **AND** show error if format is invalid
- **AND** prevent submission if invalid

#### Scenario: Email existence check
- **WHEN** user submits password reset request
- **THEN** validate email format first
- **AND** only send request if format is valid
- **AND** show generic success message regardless of whether email exists
