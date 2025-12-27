## Why

Currently, users must click on the credits display (★ 积分) to access the payment modal. To improve discoverability and make it clearer to users that they can purchase credit packages, we need to add a dedicated button in the header navigation menu labeled "用户积分套餐" (Credits Packages).

This button serves as a direct call-to-action for users to explore and purchase credit packages, improving user experience and payment conversion.

## What Changes

- Add a new "Credits Packages" button in the header's right menu
- Position it between the CreditsDisplay and language toggle buttons
- Style it as a high-visibility button (#007bff) to attract user attention
- Support both Chinese and English labels
- Reuse existing PaymentModal for consistent payment experience
- Display button for both authenticated and unauthenticated users
- Add full accessibility support (ARIA labels, keyboard navigation)

## Impact

- **Affected specs**: header-navigation (new interaction)
- **Affected code**:
  - `src/components/Header.tsx` - Main header component
  - `src/i18n/translations.ts` - If translations need to be added
- **Breaking changes**: None - purely additive feature
- **Migration**: None required - existing functionality unchanged
- **Risk assessment**: Low - isolated change with no dependencies
