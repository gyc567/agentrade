## REMOVED Requirements
### Requirement: Two-Factor Authentication (OTP)
**Reason**: 用户要求简化登录流程，删除OTP验证步骤
**Migration**: 现有用户的OTP设置将被忽略，登录时不再需要验证OTP

## MODIFIED Requirements
### Requirement: User Registration
The system SHALL allow users to register with email and password to create a new account.

#### Scenario: Successful registration
- **WHEN** user provides valid email and password
- **AND** email is not already registered
- **THEN** create user account with hashed password
- **AND** return user ID
- **AND** user account is saved to database

### Requirement: User Login
The system SHALL allow registered users to authenticate using email and password.

#### Scenario: Successful login
- **WHEN** valid email and password are provided
- **THEN** return JWT token
- **AND** return user_id and email
- **AND** user session is established

#### Scenario: Mandatory OTP for all users
**REMOVED**: OTP is no longer mandatory for users
