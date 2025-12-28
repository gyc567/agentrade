## 1. Implementation

### 1.1 Header Shortcut
- [ ] 1.1.1 Add state + handlers for the one-click trader button in `HeaderBar`
- [ ] 1.1.2 Render the button to the left of the 实时 (realtime) nav item on desktop
- [ ] 1.1.3 Render an equivalent action inside the authenticated mobile menu
- [ ] 1.1.4 Style the button using existing nav visual language and add aria-label/title attributes

### 1.2 Modal Wiring
- [ ] 1.2.1 Fetch enabled AI models/exchanges when the user is logged in
- [ ] 1.2.2 Filter AI models to platform-provided options (DeepSeek + Gemini family)
- [ ] 1.2.3 Reuse `TraderConfigModal` with the fetched options
- [ ] 1.2.4 Call `api.createTrader` on save and close the modal on success
- [ ] 1.2.5 Handle API/validation errors gracefully (alerts/logging consistent with existing flow)

### 1.3 Internationalization
- [ ] 1.3.1 Add translation keys for the shortcut label/aria text in zh/en
- [ ] 1.3.2 Ensure text updates when the language toggle changes

### 1.4 Data Safety
- [ ] 1.4.1 Guard API calls so they run only when authenticated
- [ ] 1.4.2 Provide fallback messaging/toast when required configuration is missing
- [ ] 1.4.3 Prevent duplicate submits by disabling the modal during save

## 2. Testing

### 2.1 Unit / Component Tests
- [ ] 2.1.1 Add a dedicated HeaderBar test that verifies the shortcut visibility when logged in vs logged out
- [ ] 2.1.2 Mock `TraderConfigModal` to assert it opens with the right props
- [ ] 2.1.3 Assert the English/Chinese labels render correctly
- [ ] 2.1.4 Verify the mocked `onSave` path triggers `api.createTrader`

### 2.2 Manual Regression
- [ ] 2.2.1 Smoke test header navigation (desktop + mobile)
- [ ] 2.2.2 Confirm the trader creation modal still works from the original AI Trader page

## 3. Validation

- [ ] 3.1 Run `npm run test` (web) and ensure Vitest suite passes
- [ ] 3.2 Run `openspec validate add-one-click-trader-button --strict` before submission
