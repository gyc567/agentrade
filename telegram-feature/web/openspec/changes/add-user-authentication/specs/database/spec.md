# OpenSpec Delta: User Authentication Database Schema

## ADDED Requirements
### Requirement: Users Table Schema
The database SHALL contain a users table with proper schema for authentication data.

#### Scenario: Table creation
- **WHEN** database is initialized
- **THEN** create users table with the following schema:
  - id: TEXT PRIMARY KEY (UUID)
  - email: TEXT UNIQUE NOT NULL
  - password_hash: TEXT NOT NULL
  - created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
  - otp_secret: TEXT (nullable)
  - otp_verified: BOOLEAN DEFAULT 0
  - otp_enabled: BOOLEAN DEFAULT 0
  - is_active: BOOLEAN DEFAULT 1
  - is_admin: BOOLEAN DEFAULT 0
  - beta_code: TEXT (nullable)

#### Scenario: Email uniqueness enforcement
- **WHEN** two users attempt to register with same email
- **THEN** database enforces UNIQUE constraint on email field
- **AND** second registration fails with duplicate key error

#### Scenario: Required fields validation
- **WHEN** inserting user without required fields (id, email, password_hash)
- **THEN** database rejects insertion
- **AND** returns error indicating missing required fields

### Requirement: Email Index
The database SHALL create an index on the email field for performance.

#### Scenario: Index creation
- **WHEN** users table is created
- **THEN** create index idx_users_email on email field
- **AND** index improves performance of email-based queries

#### Scenario: Email lookup performance
- **WHEN** querying user by email (e.g., during login)
- **THEN** database uses index for O(log n) lookup instead of O(n) full scan
- **AND** query returns quickly even with many users

### Requirement: User Creation
The system SHALL provide a CreateUser method to add new users to the database.

#### Scenario: Successful user creation
- **WHEN** CreateUser() is called with valid User struct
- **AND** email is not already in database
- **THEN** insert user into users table
- **AND** return no error
- **AND** user is immediately queryable

#### Scenario: Duplicate email on creation
- **WHEN** CreateUser() is called with email that already exists
- **THEN** return error indicating duplicate email
- **AND** no user is inserted

#### Scenario: Database connection failure during creation
- **WHEN** CreateUser() is called but database is unavailable
- **THEN** return error indicating connection failure
- **AND** no user is inserted

### Requirement: User Retrieval by Email
The system SHALL provide GetUserByEmail method to find users by email address.

#### Scenario: User found by email
- **WHEN** GetUserByEmail() is called with existing email
- **THEN** return User struct with all fields populated
- **AND** return no error

#### Scenario: User not found by email
- **WHEN** GetUserByEmail() is called with non-existent email
- **THEN** return nil or null User struct
- **AND** return no error (nil result is expected for missing user)

#### Scenario: Email parameter validation
- **WHEN** GetUserByEmail() is called with empty or nil email
- **THEN** return error indicating invalid email parameter
- **AND** do not query database

### Requirement: User Retrieval by ID
The system SHALL provide GetUserByID method to find users by UUID.

#### Scenario: User found by ID
- **WHEN** GetUserByID() is called with existing UUID
- **THEN** return User struct with all fields
- **AND** return no error

#### Scenario: User not found by ID
- **WHEN** GetUserByID() is called with non-existent UUID
- **THEN** return nil or null User struct
- **AND** return no error

#### Scenario: Invalid UUID format
- **WHEN** GetUserByID() is called with malformed UUID
- **THEN** return error indicating invalid UUID format
- **AND** do not query database

### Requirement: OTP Verification Status Update
The system SHALL provide UpdateUserOTPVerified method to update OTP verification status.

#### Scenario: Mark OTP as verified
- **WHEN** UpdateUserOTPVerified() is called with user_id and verified=true
- **THEN** update user's otp_verified field to 1 (true)
- **AND** return no error
- **AND** change is immediately persisted to database

#### Scenario: Mark OTP as unverified
- **WHEN** UpdateUserOTPVerified() is called with user_id and verified=false
- **THEN** update user's otp_verified field to 0 (false)
- **AND** return no error

#### Scenario: Update non-existent user
- **WHEN** UpdateUserOTPVerified() is called with non-existent user_id
- **THEN** return error indicating user not found
- **AND** no update is performed

### Requirement: User Password Update
The system SHALL support updating user password securely.

#### Scenario: Password update with hash
- **WHEN** UpdateUserPassword() is called with user_id and new password hash
- **THEN** update user's password_hash field
- **AND** previous password hash is replaced
- **AND** return no error
- **AND** change is immediately persisted

### Requirement: User Status Management
The system SHALL track user account status (active/inactive, admin flag).

#### Scenario: Check if user is active
- **GIVEN** user record with is_active field
- **WHEN** querying user information
- **THEN** is_active field indicates if account is enabled
- **AND** inactive users cannot authenticate

#### Scenario: Check admin privileges
- **GIVEN** user record with is_admin field
- **WHEN** checking permissions
- **THEN** is_admin field indicates if user has admin rights
- **AND** admin users have access to administrative functions

### Requirement: Beta Code Tracking
The system SHALL track beta invitation codes for registered users.

#### Scenario: Store beta code during registration
- **WHEN** CreateUser() is called with beta_code parameter
- **THEN** save beta_code to user record
- **AND** beta_code is stored as TEXT (nullable)
- **AND** can be used for access control or analytics

#### Scenario: Retrieve beta code
- **GIVEN** user with beta_code set
- **WHEN** user information is retrieved
- **THEN** beta_code field is included in User struct
- **AND** can be used for business logic

### Requirement: Database Connection Management
The system SHALL manage database connections properly for authentication operations.

#### Scenario: Connection initialization
- **WHEN** server starts
- **THEN** initialize database connection
- **AND** verify connection with test query
- **AND** make connection available for auth operations

#### Scenario: Connection pooling
- **GIVEN** multiple concurrent authentication requests
- **WHEN** database operations are performed
- **THEN** use connection pooling to handle concurrent requests efficiently
- **AND** avoid connection exhaustion

#### Scenario: Connection error handling
- **WHEN** database connection fails during auth operation
- **THEN** return appropriate error to client
- **AND** log error for debugging
- **AND** do not expose internal error details to client

### Requirement: Data Integrity Constraints
The database SHALL enforce data integrity for authentication data.

#### Scenario: UUID format enforcement
- **WHEN** inserting user with id field
- **THEN** validate UUID format (e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
- **AND** reject invalid UUID format

#### Scenario: Email format enforcement
- **WHEN** inserting user with email field
- **THEN** validate email contains @ symbol and domain
- **AND** enforce reasonable email length limits

#### Scenario: Password hash validation
- **WHEN** inserting user with password_hash field
- **THEN** validate hash is not empty and has reasonable length
- **AND** reject empty or invalid hashes

### Requirement: Enhanced User Schema for Security
The database SHALL support additional fields for rate limiting and account lockout.

#### Scenario: Lockout fields
- **WHEN** users table is created or migrated
- **THEN** include locked_until field (DATETIME, nullable)
- **AND** include failed_attempts field (INTEGER, DEFAULT 0)
- **AND** include last_failed_at field (DATETIME, nullable)
- **AND** these fields track security events

#### Scenario: Failed attempt tracking
- **GIVEN** user attempts to login with wrong password
- **WHEN** failed_attempts is incremented
- **THEN** increment failed_attempts field
- **AND** update last_failed_at to current timestamp
- **AND** if 5 attempts reached, set locked_until to 30 minutes future

#### Scenario: Lockout expiration check
- **WHEN** checking if account is locked
- **AND** locked_until field is not null
- **THEN** compare locked_until with current time
- **AND** if locked_until > now, account is locked
- **AND** if locked_until <= now, account is unlocked (auto-unlock)

### Requirement: Password Reset Tokens Table
The database SHALL store password reset tokens with expiration tracking.

#### Scenario: Password resets table creation
- **WHEN** database is initialized for password reset
- **THEN** create password_resets table with schema:
  - id: TEXT PRIMARY KEY (UUID)
  - user_id: TEXT NOT NULL (foreign key to users.id)
  - token_hash: TEXT NOT NULL (hashed token)
  - expires_at: DATETIME NOT NULL (expiration time)
  - used_at: DATETIME (nullable, when token was used)
  - created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

#### Scenario: Reset token storage
- **WHEN** user requests password reset
- **THEN** generate secure random token
- **AND** hash the token with bcrypt or SHA-256
- **AND** store hashed token in password_resets table
- **AND** set expires_at to 1 hour from now
- **AND** associate with user's ID

#### Scenario: Reset token validation
- **WHEN** validating reset token
- **THEN** hash provided token
- **AND** lookup in password_resets table by user_id and token_hash
- **AND** check if token exists and not used
- **AND** check if expires_at is in the future
- **AND** only accept if all conditions are met

#### Scenario: Reset token invalidation
- **WHEN** password reset is completed
- **THEN** mark token as used (set used_at timestamp)
- **AND** invalidate all other tokens for that user
- **AND** prevent token reuse

### Requirement: Login Attempts Audit Table
The database SHALL track login attempts for security audit and rate limiting.

#### Scenario: Login attempts table creation
- **WHEN** database is initialized for security tracking
- **THEN** create login_attempts table with schema:
  - id: TEXT PRIMARY KEY (UUID)
  - user_id: TEXT (nullable, for failed attempts may not exist)
  - email: TEXT (attempted email)
  - ip_address: TEXT NOT NULL
  - success: BOOLEAN NOT NULL (true for successful, false for failed)
  - timestamp: DATETIME DEFAULT CURRENT_TIMESTAMP
  - user_agent: TEXT (optional)

#### Scenario: Successful login logging
- **WHEN** user successfully logs in
- **THEN** record attempt in login_attempts table
- **AND** set success = true
- **AND** include user_id, ip_address, timestamp

#### Scenario: Failed login logging
- **WHEN** login attempt fails
- **THEN** record attempt in login_attempts table
- **AND** set success = false
- **AND** include attempted email, ip_address, timestamp
- **AND** may not have user_id if email doesn't exist

#### Scenario: Rate limiting query
- **GIVEN** need to check rate limits for an IP
- **WHEN** querying login_attempts
- **THEN** filter by ip_address and timestamp in last 15 minutes
- **AND** count only failed attempts
- **AND** return count for enforcement

### Requirement: Indexes for Performance
The database SHALL create indexes on frequently queried fields.

#### Scenario: Rate limiting index
- **WHEN** login_attempts table is created
- **THEN** create idx_login_attempts_ip_time on (ip_address, timestamp)
- **AND** create idx_login_attempts_email_time on (email, timestamp)
- **AND** indexes improve rate limiting query performance

#### Scenario: Reset token index
- **WHEN** password_resets table is created
- **THEN** create idx_password_resets_user on (user_id, used_at)
- **AND** create idx_password_resets_token on token_hash
- **AND** indexes speed up token lookup

#### Scenario: User lockout index
- **WHEN** users table has lockout fields
- **THEN** create idx_users_locked_until on locked_until
- **AND** create idx_users_failed_attempts on failed_attempts
- **AND** indexes speed up lockout checks

### Requirement: Data Retention Policy
The database SHALL implement cleanup for old security data.

#### Scenario: Login attempts cleanup
- **WHEN** cleaning up old data
- **THEN** delete login_attempts older than 30 days
- **AND** keep only recent data for rate limiting
- **AND** schedule automatic cleanup job

#### Scenario: Expired reset tokens cleanup
- **WHEN** cleaning up expired tokens
- **THEN** delete password_resets where expires_at < now
- **AND** delete old used tokens (older than 7 days)
- **AND** prevent table bloat

#### Scenario: Manual lockout clearing
- **GIVEN** admin needs to clear lockout
- **WHEN** UpdateUserLockout() is called
- **THEN** set locked_until to null
- **AND** reset failed_attempts to 0
- **AND** clear last_failed_at
