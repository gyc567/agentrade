## MODIFIED Requirements

### Requirement: Header Navigation Credits Packages Button Visibility
The Header component SHALL display the Credits Packages button in the right navigation menu that is visible to all users (authenticated and unauthenticated) in production.

#### Scenario: Button is visible in production at all times
- **WHEN** user visits https://www.agentrade.xyz
- **THEN** button displays in the right navigation menu
- **AND** button is positioned between CreditsDisplay and language toggle
- **AND** button displays text "积分套餐" in Chinese mode or "Packages" in English mode
- **AND** button styling shows blue background (#007bff) with white text

#### Scenario: Button is visible on all page types
- **WHEN** user is on any page (dashboard, login, register, etc.)
- **THEN** button appears on pages that render the Header component with `simple={false}`
- **AND** button may not appear on simple header pages (like login/register) if `simple={true}` is set

#### Scenario: Button is clickable and functional
- **WHEN** user clicks the button
- **THEN** PaymentModal opens for package selection
- **AND** user can select a package and proceed with payment

#### Scenario: Button responds to hover interaction
- **WHEN** user hovers over the button
- **THEN** background color changes to #0056b3 (darker blue)
- **AND** cursor changes to pointer

#### Scenario: Styles do not conflict with layout
- **WHEN** button is rendered alongside other navigation elements
- **THEN** button is not clipped or hidden by container overflow
- **AND** button is not obscured by z-index stacking issues
- **AND** button maintains proper spacing with adjacent elements

