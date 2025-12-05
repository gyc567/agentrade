## ADDED Requirements

### Requirement: User Profile Display Page
The system SHALL provide a dedicated user profile page that displays user information and credit balance.

#### Scenario: Access user profile from dropdown menu
- **WHEN** a logged-in user clicks the username dropdown menu
- **AND** selects "User Profile" option
- **THEN** the system SHALL navigate to the user profile page
- **AND** display the user's email address
- **AND** show the user's current credit balance
- **AND** display the user's total credits earned
- **AND** show the user's credits used

#### Scenario: Display user profile information
- **WHEN** a user accesses the profile page
- **THEN** the system SHALL display a card-based layout
- **AND** show user email as the main identifier
- **AND** display current available credits prominently
- **AND** show credit statistics (total earned, total used)
- **AND** provide a back navigation option

#### Scenario: Mobile responsive design
- **WHEN** a user accesses the profile page on mobile device
- **THEN** the layout SHALL adapt to screen size
- **AND** maintain readability and usability
- **AND** preserve all information display

### Requirement: User Profile Navigation Integration
The system SHALL integrate user profile access into the existing user dropdown menu.

#### Scenario: Add user profile menu item
- **WHEN** a user is logged in and opens the user dropdown menu
- **THEN** the system SHALL display a "User Profile" option
- **AND** position it between the user info section and logout button
- **AND** maintain consistent styling with existing menu items

#### Scenario: Menu item internationalization
- **WHEN** the system language is set to English
- **THEN** the menu item SHALL display as "User Profile"
- **WHEN** the system language is set to Chinese
- **THEN** the menu item SHALL display as "用户信息"

### Requirement: User Profile Data Fetching
The system SHALL fetch and display user credit information using existing APIs.

#### Scenario: Fetch user credit data
- **WHEN** the user profile page loads
- **THEN** the system SHALL call the existing user credit API
- **AND** display the returned credit information
- **AND** handle loading states appropriately
- **AND** show error messages if the API fails

#### Scenario: Handle unauthenticated access
- **WHEN** an unauthenticated user tries to access the profile page
- **THEN** the system SHALL redirect to the login page
- **AND** preserve the intended destination for post-login redirect

### Requirement: User Profile Page Styling
The system SHALL maintain consistent visual design with the existing application.

#### Scenario: Consistent branding
- **WHEN** the user profile page renders
- **THEN** it SHALL use the same color scheme as the main application
- **AND** follow the same typography patterns
- **AND** maintain consistent spacing and layout principles

#### Scenario: Card-based layout
- **WHEN** displaying user information
- **THEN** the system SHALL use card components for information grouping
- **AND** provide clear visual hierarchy
- **AND** ensure adequate white space for readability