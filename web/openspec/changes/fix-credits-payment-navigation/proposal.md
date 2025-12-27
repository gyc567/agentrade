## Why

Currently, clicking on the credits display (★ 用户积分) in the header navigates to the user profile page, which doesn't allow users to purchase more credits. The intended behavior is to open the payment modal so users can immediately buy credit packages.

## What Changes

- CreditsValue component click handler shall open PaymentModal instead of navigating to /profile
- PaymentModal will be integrated into Header component with state management
- User can directly purchase credits without navigating away from current page

## Impact

- Affected specs: credits-display (CreditsValue component interaction)
- Affected code:
  - `src/components/CreditsDisplay/CreditsValue.tsx` - Remove profile navigation
  - `src/components/Header.tsx` - Add payment modal state and handler
  - `src/features/payment/components/PaymentModal.tsx` - Already exists, will be used
