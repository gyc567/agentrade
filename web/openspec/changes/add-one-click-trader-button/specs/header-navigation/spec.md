## ADDED Requirements

### Requirement: Header One-Click Trader Shortcut
Authenticated users SHALL see a "一键生成交易员 / One-Click Trader" shortcut in the global header that opens the standard create-trader modal with platform-provided AI models.

#### Scenario: Desktop shortcut placement
- **GIVEN** the user is logged in on desktop widths
- **WHEN** the header renders
- **THEN** a button labeled "一键生成交易员" (ZH) or "One-Click Trader" (EN) appears immediately to the left of the 实时 (realtime) tab
- **AND** the button includes an aria-label + tooltip describing the action
- **AND** the button follows the existing nav style (rounded, brand yellow hover, keyboard focusable)

#### Scenario: Mobile shortcut availability
- **GIVEN** the user opens the mobile menu while logged in
- **THEN** the button appears near the top of the authenticated actions list
- **AND** tapping it closes the menu and opens the trader creation modal

#### Scenario: Modal launch
- **WHEN** the shortcut button is clicked or tapped
- **THEN** the standard `TraderConfigModal` opens
- **AND** it displays the same form fields/validations as the existing create trader flow
- **AND** closing the modal restores focus to the button

#### Scenario: AI model filtering
- **WHEN** the modal loads its AI model list
- **THEN** it only shows platform-approved models (currently DeepSeek and Gemini variants)
- **AND** it prefills the first available model + exchange when possible
- **AND** it gracefully warns the user if no eligible models/exchanges are configured

#### Scenario: Trader creation
- **WHEN** the user submits the modal form
- **THEN** the frontend calls the existing `POST /traders` API
- **AND** the modal closes automatically on success
- **AND** failures display the same alert/error handling as the AI Trader page
