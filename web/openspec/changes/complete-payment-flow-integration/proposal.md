## Why

Users click on a credit package in the payment modal, but the UI gets stuck on "处理中" (processing) state and never transitions to success or error. The payment modal becomes unresponsive. The root cause is that the Crossmint SDK is not actually integrated into the payment flow—the `CrossmintService.initializeCheckout()` method is an empty stub that does nothing. Additionally, the application has an existing MetaMask wallet integration that is completely isolated from the payment system, missing the opportunity to leverage it for USDT token payments on blockchain networks.

## What Changes

This is a critical payment flow completion that unblocks the entire payment feature:

- **Install Crossmint SDK**: Add `@crossmint/client-sdk-react-ui` dependency for headless checkout
- **Add CrossmintProvider**: Wrap application with `CrossmintProvider` in AppWithProviders
- **Implement Crossmint integration**: Replace empty `CrossmintService.initializeCheckout()` stub with actual SDK initialization
- **Wire payment transitions**: Connect Crossmint checkout events to PaymentProvider state transitions (success/error/cancel)
- **Integrate MetaMask wallet**: Connect existing `useWeb3` hook to payment flow for wallet signature requirement
- **Implement USDT payment**: Add blockchain transaction logic for USDT token transfers
- **Complete callback handling**: Implement payment success/failure callbacks to update user credits

## Impact

- **Affected specs**: payment-checkout, user-credits, wallet-integration
- **Affected code**:
  - `src/features/payment/services/CrossmintService.ts` - Implement actual SDK initialization
  - `src/features/payment/services/PaymentOrchestrator.ts` - Wire event handlers
  - `src/features/payment/contexts/PaymentProvider.tsx` - Implement success/error transitions
  - `src/App.tsx` - Add CrossmintProvider wrapper
  - `src/hooks/useWeb3.ts` - Integrate with payment flow
  - `package.json` - Add Crossmint SDK dependency
- **Severity**: Critical - Payment feature is completely non-functional despite UI being present
- **User impact**: Payment button shows loading state infinitely, no way to complete purchase
- **Breaking changes**: None - adds new capability without changing existing behavior
- **Risk level**: Medium - Involves integrating external SDK and blockchain transactions

## Root Cause Analysis

### Problem Chain

1. **PaymentModal.tsx (Line 175-178)** - User clicks "继续支付" button
   ```typescript
   onClick={async () => {
     if (context.selectedPackage) {
       await context.initiatePayment(context.selectedPackage.id)
     }
   }}
   ```

2. **PaymentProvider.tsx (Line 62-78)** - Sets `paymentStatus = "loading"` and calls orchestrator
   ```typescript
   const initiatePayment = useCallback(
     async (packageId: string) => {
       setPaymentStatus("loading")
       setError(null)
       try {
         await orchestrator.createPaymentSession(packageId)
         // SDK will handle the rest via events
       } catch (err) {
         setError(message)
         setPaymentStatus("error")
       }
     },
     [orchestrator]
   )
   ```

3. **PaymentOrchestrator.ts (Line 87-128)** - Calls empty CrossmintService method
   ```typescript
   async createPaymentSession(packageId: string): Promise<void> {
     const pkg = getPackage(packageId)
     const lineItems = this.crossmintService.createLineItems(pkg)
     await this.crossmintService.initializeCheckout({
       lineItems,
       locale: "en-US",
       successCallbackURL: `...`,
       failureCallbackURL: `...`,
     })
   }
   ```

4. **CrossmintService.ts (Line 33-40)** - Empty stub, does nothing
   ```typescript
   async initializeCheckout(): Promise<void> {
     if (!this.isConfigured()) {
       throw new Error("Crossmint API Key is not configured")
     }
     // The actual SDK initialization is handled by CrossmintProvider
     // This method is for reference and future enhancements
   }
   ```

5. **Result**: `paymentStatus` never transitions from "loading" to "success" or "error"
   - Modal shows spinner indefinitely
   - No Crossmint checkout window appears
   - User cannot complete payment

### Why It Happened

1. **Stub implementation**: CrossmintService was created as a wrapper with placeholder methods
2. **Missing SDK dependency**: `@crossmint/client-sdk-react-ui` not installed in package.json
3. **Incomplete provider setup**: No `CrossmintProvider` in app hierarchy to handle checkout
4. **Isolated Web3 integration**: MetaMask wallet integration (useWeb3.ts) exists but not connected to payment flow
5. **Type definitions only**: USDT payment currency defined in types but no actual blockchain logic

### Current Architecture Status

```
Payment Modal UI:       ✅ Implemented (PaymentModal.tsx)
Package Selection:      ✅ Implemented (usePaymentPackages)
State Management:       ✅ Implemented (PaymentProvider)
Payment Orchestration:  ✅ Implemented (PaymentOrchestrator)
Crossmint SDK:          ❌ Not installed
CrossmintProvider:      ❌ Not in app hierarchy
Crossmint Integration:  ❌ Stub only, not functional
MetaMask Integration:   ✅ Separate implementation (useWeb3.ts, Web3ConnectButton.tsx)
Payment ↔ MetaMask:     ❌ Not connected
USDT Logic:             ❌ Not implemented (types only)
Payment Callbacks:      ❌ Not implemented
```

### Missing Infrastructure

1. **Crossmint SDK Package**: Need to install `@crossmint/client-sdk-react-ui`
2. **CrossmintProvider Wrapper**: Need to add to AppWithProviders for SDK initialization
3. **Event Listeners**: Need to wire Crossmint `onSuccess`, `onError`, `onCancel` events
4. **Wallet Integration**: Need to connect MetaMask signature to payment authorization
5. **Transaction Logic**: Need to implement USDT token transfer on blockchain
6. **Credit Update Callback**: Need backend integration to update user credits after payment
