# Feature: Payment Module Security & Architecture Optimization

## Summary
Address critical security issues and architectural improvements identified in the code audit.

## Problem Statement
1. Provider nesting order causes PaymentProvider to be outside AuthProvider
2. Debug console.log statements in production code
3. Weak signature verification (length check only, no HMAC)
4. Deprecated _crossmintService parameter cluttering code
5. Missing PaymentOrchestrator tests
6. No error boundary for payment failures

## Solution

### Phase 1: Immediate Fixes (P0)

#### 1.1 Fix Provider Nesting Order
**File:** `web/src/App.tsx`
```tsx
// Before:
<CrossmintProvider>
  <PaymentProvider>
    <LanguageProvider>
      <AuthProvider>

// After:
<AuthProvider>
  <CrossmintProvider>
    <PaymentProvider>
      <LanguageProvider>
```

#### 1.2 Remove Debug Logs
**Files:** PaymentProvider.tsx, PaymentApiService.ts, etc.
- Replace console.log with conditional logging
- Use environment check: `import.meta.env.DEV`

#### 1.3 Enhance Signature Verification
**File:** `CrossmintService.ts`
```typescript
import { createHmac } from 'crypto'

verifyPaymentSignature(
  signature: string,
  payload: string,
  secret: string
): boolean {
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  const expected = hmac.digest('hex')
  return timingSafeEqual(signature, expected)
}
```

### Phase 2: Short-term Improvements (P1)

#### 2.1 Clean Deprecated Parameter
**File:** `PaymentOrchestrator.ts`
```typescript
// Before:
constructor(
  _crossmintService: any, // @deprecated
  private apiService: PaymentApiService
) {}

// After:
constructor(private apiService: PaymentApiService) {}
```

#### 2.2 Add PaymentOrchestrator Tests
**File:** `__tests__/PaymentOrchestrator.test.ts`
- Test validatePackageForPayment
- Test createPaymentSession
- Test handlePaymentSuccess
- Test retryPaymentConfirmation

#### 2.3 Add PaymentErrorBoundary
**File:** `components/PaymentErrorBoundary.tsx`
```typescript
class PaymentErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return <PaymentErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}
```

## Test Plan
1. Unit tests for HMAC signature verification
2. Unit tests for PaymentOrchestrator
3. Integration test for Provider nesting
4. Error boundary rendering tests

## Rollback Plan
- Git revert for each commit
- Feature flags if needed

## Acceptance Criteria
- [ ] Provider order: Auth > Crossmint > Payment
- [ ] No console.log in production builds
- [ ] HMAC signature verification implemented
- [ ] _crossmintService parameter removed
- [ ] 100% test coverage for new code
- [ ] PaymentErrorBoundary catches and displays errors
