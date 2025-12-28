## MODIFIED Requirements

### Requirement: Payment Flow Completion via Crossmint
The payment system SHALL complete the entire payment flow when users select a package and initiate payment, utilizing Crossmint's headless checkout to process payments and integrating with MetaMask for wallet-based USDT token transfers.

#### Scenario: User initiates payment and sees Crossmint checkout
- **WHEN** user selects a package and clicks "继续支付" button
- **THEN** PaymentModal status transitions to "loading"
- **AND** Crossmint checkout window initializes and displays to user
- **AND** user can interact with payment method selection
- **AND** modal no longer shows indefinite loading spinner

#### Scenario: User completes payment successfully
- **WHEN** user completes payment through Crossmint checkout
- **THEN** Crossmint sends success event to payment handler
- **AND** PaymentModal status transitions to "success"
- **AND** screen displays success message with credits amount: "已获得 [CREDIT_AMOUNT] 积分"
- **AND** user credits are updated immediately
- **AND** "完成" button appears to close modal

#### Scenario: Payment fails or is cancelled
- **WHEN** user cancels payment or payment fails in Crossmint checkout
- **THEN** Crossmint sends failure/cancel event to payment handler
- **AND** PaymentModal status transitions to "error"
- **AND** error message displays to user
- **AND** "重试" button allows user to restart payment flow
- **AND** "关闭" button allows user to exit modal

#### Scenario: MetaMask wallet integration for USDT payment
- **WHEN** payment method requires wallet signature (USDT payment)
- **THEN** system checks if MetaMask is connected via useWeb3 hook
- **AND** if wallet not connected, payment prompts user to connect wallet
- **AND** once wallet connected, system can initiate USDT token transfer
- **AND** user signs transaction in MetaMask
- **AND** blockchain confirms token transfer

#### Scenario: Crossmint SDK is properly initialized
- **WHEN** application starts
- **THEN** Crossmint SDK is loaded via CrossmintProvider wrapper
- **AND** SDK is initialized with API key from environment
- **AND** Crossmint checkout methods are available to payment flow
- **AND** no initialization errors in console

#### Scenario: Payment API calls are made correctly
- **WHEN** payment is completed successfully
- **THEN** application makes API call to backend with payment details
- **AND** backend updates user's credit balance
- **AND** response includes updated credit amount
- **AND** PaymentModal displays final credit total

#### Scenario: No payment modal loading state indefinitely
- **WHEN** user initiates any payment action
- **THEN** loading spinner does not show for more than 30 seconds without UI update
- **AND** either checkout appears or error message is shown
- **AND** user always has a way to retry or cancel

#### Scenario: Payment state machine transitions correctly
- **WHEN** payment flow runs
- **THEN** state follows sequence: idle → loading → success/error
- **AND** each state has appropriate UI feedback
- **AND** all state transitions are logged
- **AND** no states are skipped or stuck

#### Scenario: Production payment works end-to-end
- **WHEN** user visits production site, selects package, initiates payment
- **THEN** full payment flow completes without errors
- **AND** Crossmint checkout displays correctly
- **AND** MetaMask wallet can be connected and signed
- **AND** payment success updates credits
- **AND** no console errors or warnings
- **AND** no API failures

### Requirement: Crossmint SDK Integration
The system SHALL properly integrate the Crossmint headless checkout SDK with all necessary initialization, event handling, and error recovery mechanisms.

#### Scenario: CrossmintProvider wraps application
- **WHEN** application initializes
- **THEN** CrossmintProvider is configured at AppWithProviders level
- **AND** it wraps all other providers
- **AND** Crossmint SDK is loaded before any payment components render

#### Scenario: Crossmint service initialization handles API key
- **WHEN** CrossmintService is instantiated
- **THEN** it reads VITE_CROSSMINT_CLIENT_API_KEY from environment
- **AND** isConfigured() returns true when API key is set
- **AND** no warning logs appear in console

#### Scenario: Crossmint checkout event handling
- **WHEN** checkout:order.paid event is received from Crossmint
- **THEN** event handler transitions payment to success state
- **AND** creditsAdded is set to package credit amount
- **AND** success callback is invoked

#### Scenario: Payment errors are handled gracefully
- **WHEN** Crossmint returns checkout:order.failed event
- **THEN** payment status transitions to error
- **AND** error message is stored and displayed
- **AND** user can retry without re-entering package selection

### Requirement: MetaMask Wallet Integration with Payment
The system SHALL integrate existing MetaMask wallet functionality with the payment flow to enable users to authorize payments with wallet signatures.

#### Scenario: MetaMask wallet check before USDT payment
- **WHEN** user initiates USDT payment and MetaMask not connected
- **THEN** system prompts user to connect wallet
- **AND** useWeb3.connectMetaMask() is called
- **AND** user sees wallet connection dialog

#### Scenario: Wallet signature for payment authorization
- **WHEN** wallet is connected and user confirms payment
- **THEN** system requests wallet signature via MetaMask
- **AND** user sees signature request in MetaMask extension
- **AND** once signed, payment is authorized

#### Scenario: USDT token transfer on blockchain
- **WHEN** payment is authorized by wallet signature
- **THEN** system initiates USDT token transfer transaction
- **AND** token amount corresponds to selected package pricing
- **AND** transaction is sent to appropriate blockchain (Polygon/Base/Arbitrum)
- **AND** MetaMask shows transaction confirmation dialog

### Requirement: User Credit Updates
The system SHALL update user credits immediately upon successful payment completion with proper backend integration.

#### Scenario: Credits are updated after successful payment
- **WHEN** payment is confirmed as successful by Crossmint
- **THEN** system calls API to update user credits
- **AND** response includes new total credit balance
- **AND** CreditsDisplay component refreshes with new amount

#### Scenario: Credit display reflects payment result
- **WHEN** user completes payment successfully
- **THEN** success modal shows exact credits added: "已获得 X 积分"
- **AND** after closing modal, header CreditsDisplay shows updated total
- **AND** no manual page refresh needed

## REMOVED Requirements

### Requirement: Empty Crossmint Service Stub
**Reason**: This requirement described the placeholder implementation that left payment flow incomplete. It is being replaced with actual Crossmint SDK integration.

**Migration**: The `CrossmintService` class structure is retained but methods are fully implemented with actual SDK calls instead of empty stubs.
