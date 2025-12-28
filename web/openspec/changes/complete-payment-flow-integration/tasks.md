## Tasks: Complete Payment Flow Integration

### Phase 1: Dependency Installation
- [ ] 1.1 Install Crossmint SDK: `npm install @crossmint/client-sdk-react-ui`
- [ ] 1.2 Verify installation: check node_modules and package-lock.json
- [ ] 1.3 Update TypeScript types if needed

### Phase 2: CrossmintProvider Setup
- [ ] 2.1 Read Crossmint SDK documentation for CrossmintProvider
- [ ] 2.2 Add CrossmintProvider import to src/App.tsx
- [ ] 2.3 Wrap application with CrossmintProvider in AppWithProviders
- [ ] 2.4 Configure CrossmintProvider with API key from environment
- [ ] 2.5 Verify CrossmintProvider loads without errors
- [ ] 2.6 Check console for SDK initialization messages

### Phase 3: Crossmint Service Implementation
- [ ] 3.1 Update `src/features/payment/services/CrossmintService.ts`
- [ ] 3.2 Implement actual `initializeCheckout()` method using SDK
- [ ] 3.3 Replace empty stub with Crossmint SDK method call
- [ ] 3.4 Add proper TypeScript types for checkout configuration
- [ ] 3.5 Implement error handling for SDK initialization failures
- [ ] 3.6 Add logging for debugging checkout flow
- [ ] 3.7 Test service initialization in isolation

### Phase 4: Event Handling and State Transitions
- [ ] 4.1 Update `src/features/payment/services/PaymentOrchestrator.ts`
- [ ] 4.2 Implement event listener setup for Crossmint callbacks
- [ ] 4.3 Handle `checkout:order.paid` event → transition to success
- [ ] 4.4 Handle `checkout:order.failed` event → transition to error
- [ ] 4.5 Handle `checkout:order.cancelled` event → reset to idle
- [ ] 4.6 Implement proper error message extraction from events
- [ ] 4.7 Add event logging for debugging
- [ ] 4.8 Test event handlers with mock events

### Phase 5: Payment Provider Completion
- [ ] 5.1 Review `src/features/payment/contexts/PaymentProvider.tsx`
- [ ] 5.2 Ensure `initiatePayment()` properly calls orchestrator
- [ ] 5.3 Add success callback handling to set `creditsAdded`
- [ ] 5.4 Add error callback handling with error message
- [ ] 5.5 Implement `resetPayment()` to clear all state
- [ ] 5.6 Add proper cleanup in useEffect for event listeners
- [ ] 5.7 Test state transitions with mock data

### Phase 6: MetaMask Wallet Integration
- [ ] 6.1 Review `src/hooks/useWeb3.ts` implementation
- [ ] 6.2 Create integration point between useWeb3 and payment flow
- [ ] 6.3 Add wallet connection check in payment initiation
- [ ] 6.4 Implement `connectWalletIfNeeded()` helper function
- [ ] 6.5 Request wallet signature before USDT payment
- [ ] 6.6 Pass wallet address to payment orchestrator
- [ ] 6.7 Store active wallet in payment context
- [ ] 6.8 Handle wallet disconnection during payment

### Phase 7: USDT Payment Implementation
- [ ] 7.1 Create `src/features/payment/services/USDTPaymentService.ts`
- [ ] 7.2 Implement USDT token contract interaction
- [ ] 7.3 Add token approval transaction (if needed)
- [ ] 7.4 Implement token transfer to merchant wallet
- [ ] 7.5 Handle gas estimation for transactions
- [ ] 7.6 Monitor transaction confirmation
- [ ] 7.7 Handle transaction failures with proper error messages
- [ ] 7.8 Test with test tokens on testnet

### Phase 8: Backend Integration
- [ ] 8.1 Create/update API endpoint for credit updates
- [ ] 8.2 Implement backend payment verification
- [ ] 8.3 Create `src/services/paymentApi.ts` (or enhance existing)
- [ ] 8.4 Implement `updateUserCredits()` API call
- [ ] 8.5 Add proper error handling for API failures
- [ ] 8.6 Implement retry logic for failed updates
- [ ] 8.7 Add logging and monitoring
- [ ] 8.8 Test API integration

### Phase 9: UI/UX Polish
- [ ] 9.1 Test PaymentModal loading state display
- [ ] 9.2 Verify success message formatting
- [ ] 9.3 Verify error message formatting
- [ ] 9.4 Test button transitions (disabled during loading)
- [ ] 9.5 Implement proper focus management
- [ ] 9.6 Verify accessibility (aria-labels, roles)
- [ ] 9.7 Test responsive design on mobile

### Phase 10: Testing & Validation
- [ ] 10.1 Test payment flow end-to-end locally
- [ ] 10.2 Test with actual Crossmint SDK
- [ ] 10.3 Test payment success scenario
- [ ] 10.4 Test payment failure scenario
- [ ] 10.5 Test payment cancellation
- [ ] 10.6 Test MetaMask connection flow
- [ ] 10.7 Test USDT token transfer
- [ ] 10.8 Test credit update
- [ ] 10.9 Test error recovery and retry
- [ ] 10.10 Verify no console errors

### Phase 11: Production Deployment Preparation
- [ ] 11.1 Build production bundle
- [ ] 11.2 Check bundle size for regressions
- [ ] 11.3 Verify environment variables in Vercel
- [ ] 11.4 Run OpenSpec validation: `openspec validate complete-payment-flow-integration --strict`
- [ ] 11.5 Create deployment checklist
- [ ] 11.6 Document configuration requirements
- [ ] 11.7 Prepare rollback plan

### Phase 12: Deployment & Monitoring
- [ ] 12.1 Deploy to Vercel staging
- [ ] 12.2 Test payment flow in staging
- [ ] 12.3 Verify MetaMask integration in staging
- [ ] 12.4 Deploy to production
- [ ] 12.5 Monitor error logs for issues
- [ ] 12.6 Monitor Crossmint dashboard for failed payments
- [ ] 12.7 Verify user credits are updating correctly
- [ ] 12.8 Test with real users (if applicable)

### Phase 13: Documentation & Cleanup
- [ ] 13.1 Document payment flow architecture
- [ ] 13.2 Document MetaMask integration points
- [ ] 13.3 Document USDT payment process
- [ ] 13.4 Update README with payment setup instructions
- [ ] 13.5 Archive this change via: `openspec archive complete-payment-flow-integration --yes`
- [ ] 13.6 Update specs/payment-checkout/spec.md with final behavior
- [ ] 13.7 Clean up any temporary code or logs

## Success Criteria

All of the following must be true to consider this complete:

1. ✅ Crossmint SDK is installed and available
2. ✅ CrossmintProvider wraps application without errors
3. ✅ User can click "继续支付" and see Crossmint checkout
4. ✅ Payment success transitions modal to success state
5. ✅ Payment failure shows error message with retry option
6. ✅ MetaMask wallet can be connected from payment flow
7. ✅ USDT token transfer executes on blockchain
8. ✅ User credits are updated after successful payment
9. ✅ No indefinite loading states
10. ✅ No console errors in browser DevTools
11. ✅ Production deployment is successful
12. ✅ Monitoring shows healthy payment processing

## Key Files to Modify

1. `src/App.tsx` - Add CrossmintProvider
2. `src/features/payment/services/CrossmintService.ts` - Implement actual SDK
3. `src/features/payment/services/PaymentOrchestrator.ts` - Wire events
4. `src/features/payment/contexts/PaymentProvider.tsx` - Complete state transitions
5. `src/hooks/useWeb3.ts` - Add payment integration
6. `package.json` - Add Crossmint SDK dependency
7. `src/features/payment/components/PaymentModal.tsx` - May need minor adjustments

## Dependencies

- `@crossmint/client-sdk-react-ui` - Crossmint headless checkout
- `ethers.js` or `web3.js` - For blockchain interactions (likely already installed)
- Existing MetaMask integration via `window.ethereum`
- Backend API for credit updates

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Crossmint SDK integration complexity | Review official docs, start with minimal implementation |
| Blockchain transaction failures | Implement proper error handling and retry logic |
| MetaMask not installed on user device | Detect and provide fallback payment method |
| Production issues after deployment | Monitor logs, have rollback plan ready |
| Credit update API failures | Implement idempotent operations and retry logic |
| User experience during payment | Test thoroughly on real devices and networks |
