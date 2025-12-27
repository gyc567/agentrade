## ADDED Requirements

### Requirement: Header Navigation Credits Packages Button
The Header component SHALL display a dedicated "Credits Packages" button in the right navigation menu that opens the payment modal when clicked.

#### Scenario: Button appears in correct position
- **WHEN** user views the Header component
- **THEN** button appears positioned between CreditsDisplay and language toggle
- **AND** button displays text "积分套餐" in Chinese mode
- **AND** button displays text "Packages" in English mode
- **AND** button is visible to both authenticated and unauthenticated users

#### Scenario: Button opens payment modal
- **WHEN** user clicks on the Credits Packages button
- **THEN** PaymentModal opens with idle state (package selection)
- **AND** user can select a package and proceed with payment
- **AND** user can close modal using Escape key or close button

#### Scenario: Button styling and interactions
- **WHEN** button is displayed normally
- **THEN** background color is #007bff (blue)
- **AND** text color is white
- **AND** border radius is 4px
- **AND** padding is px-4 py-2

#### Scenario: Button hover state
- **WHEN** user hovers over the Credits Packages button
- **THEN** background color changes to #0056b3 (darker blue)
- **AND** cursor changes to pointer
- **AND** transition is smooth

#### Scenario: Keyboard accessibility
- **WHEN** user navigates to button using Tab key
- **THEN** button receives focus with visible indicator
- **AND** user can activate button by pressing Enter or Space key
- **AND** aria-label is properly set for screen readers
- **AND** title attribute provides tooltip on hover

#### Scenario: Language switching
- **WHEN** user switches language via language toggle
- **THEN** button text updates to match selected language
- **AND** aria-label updates appropriately
- **AND** title tooltip updates for new language
