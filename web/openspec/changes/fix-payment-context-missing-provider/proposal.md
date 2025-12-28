## Why

Users visiting the application encounter a runtime error: `usePaymentContext must be used within PaymentProvider`. This occurs because the `PaymentModal` component (in HeaderBar) uses the `usePaymentContext` hook, but the component is not wrapped within a `PaymentProvider`. The provider is missing from the application's top-level component structure, preventing any payment functionality from working.

## What Changes

This is a context provider setup bug that blocks all payment functionality. The fix involves:

- Adding `PaymentProvider` import to `src/App.tsx`
- Wrapping the entire application with `PaymentProvider` in the `AppWithProviders` component
- Ensuring proper provider hierarchy: `PaymentProvider` → `AuthProvider` → `LanguageProvider` → `App`
- Initializing `PaymentProvider` with the `CrossmintService`

## Impact

- **Affected specs**: payment-checkout, header-navigation
- **Affected code**:
  - `src/App.tsx` - AppWithProviders component
  - `src/components/landing/HeaderBar.tsx` - Uses PaymentModal which requires context
  - `src/features/payment/components/PaymentModal.tsx` - Uses usePaymentContext
- **Severity**: Critical - Blocks entire payment feature in production
- **User impact**: Payment button visible but clicking throws error
- **Breaking changes**: None - purely additive fix
- **Risk level**: Very Low - only adds required provider wrapper

## Root Cause Analysis

### Problem Chain

1. **HeaderBar.tsx (Line 664-667)** - Renders `<PaymentModal isOpen={isPaymentModalOpen} />`
2. **PaymentModal.tsx (Line 35)** - Uses `const context = usePaymentContext()`
3. **PaymentProvider.tsx (Line 95)** - Throws error if not within provider:
   ```typescript
   if (!context) {
     throw new Error("usePaymentContext must be used within PaymentProvider")
   }
   ```
4. **App.tsx (Line 819-827)** - Missing `<PaymentProvider>` wrapper

### Why It Happened

- `PaymentProvider` was implemented but never integrated into the app's provider hierarchy
- `HeaderBar` was modified to add `PaymentModal` without verifying the provider was set up
- The error only manifests when users interact with the Payment button (client-side runtime error)

### Current Provider Hierarchy

```
AppWithProviders (export default)
├─ LanguageProvider
├─ AuthProvider
└─ App
    ├─ LandingPage
    │  └─ HeaderBar
    │     └─ PaymentModal ❌ (No PaymentProvider)
```

### Required Provider Hierarchy

```
AppWithProviders (export default)
├─ PaymentProvider ✅ (ADD THIS)
├─ LanguageProvider
├─ AuthProvider
└─ App
    ├─ LandingPage
    │  └─ HeaderBar
    │     └─ PaymentModal ✅ (Now within context)
```
