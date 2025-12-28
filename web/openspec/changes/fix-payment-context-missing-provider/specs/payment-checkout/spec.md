## MODIFIED Requirements

### Requirement: Payment Context Provider Setup
The application SHALL wrap all components that use payment functionality with the PaymentProvider context, enabling payment context hooks to access payment state and methods throughout the application.

#### Scenario: PaymentModal can access payment context
- **WHEN** user navigates to any page that renders HeaderBar with PaymentModal
- **THEN** PaymentModal initializes without throwing context error
- **AND** usePaymentContext hook in PaymentModal successfully retrieves payment context
- **AND** PaymentModal displays package selection interface

#### Scenario: Payment context is available at application root level
- **WHEN** application starts
- **THEN** PaymentProvider is initialized at root level (AppWithProviders)
- **AND** PaymentProvider wraps all other providers and components
- **AND** payment service is properly initialized
- **AND** no "usePaymentContext must be used within PaymentProvider" error occurs

#### Scenario: Provider hierarchy is correct
- **WHEN** application renders
- **THEN** provider order is: PaymentProvider → AuthProvider → LanguageProvider → App
- **AND** PaymentProvider is outermost to wrap all descendent components
- **AND** AuthProvider comes before App (for auth context)
- **AND** LanguageProvider comes before App (for language context)

#### Scenario: Payment service is initialized with correct dependencies
- **WHEN** PaymentProvider is instantiated
- **THEN** it receives CrossmintService instance
- **AND** CrossmintService is properly configured with API key
- **AND** payment context is ready for consumption by nested components

#### Scenario: No context errors in production
- **WHEN** user visits production site and clicks payment button
- **THEN** no "usePaymentContext must be used within PaymentProvider" error
- **AND** no context-related errors in browser console
- **AND** payment modal opens successfully
- **AND** user can select and purchase packages

