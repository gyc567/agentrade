## MODIFIED Requirements

### Requirement: CreditsValue Component Click Navigation
The CreditsValue component SHALL allow users to open the payment modal by clicking on the credits display, enabling immediate credit purchases.

#### Scenario: User clicks on credits to open payment modal
- **WHEN** user clicks on the credits value (★ 积分数值)
- **THEN** PaymentModal opens with package selection interface
- **AND** user can select and purchase a credit package
- **AND** component displays cursor: pointer to indicate clickability

#### Scenario: Keyboard accessibility for payment modal
- **WHEN** user presses Enter or Space while credits value has focus
- **THEN** PaymentModal opens with package selection interface
- **AND** component has proper role="button" and tabIndex={0} for accessibility
