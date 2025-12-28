## 1. Root Cause Verification

### 1.1 Verify Missing Provider
- [ ] 1.1.1 Check App.tsx AppWithProviders component (line 819-827)
- [ ] 1.1.2 Confirm PaymentProvider is NOT in provider hierarchy
- [ ] 1.1.3 Verify HeaderBar uses PaymentModal (line 664-667)
- [ ] 1.1.4 Verify PaymentModal uses usePaymentContext (line 35)
- [ ] 1.1.5 Confirm error message in browser console exactly matches issue

### 1.2 Verify Provider Implementation
- [ ] 1.2.1 Check PaymentProvider exists in src/features/payment/contexts/PaymentProvider.tsx
- [ ] 1.2.2 Verify PaymentProvider accepts children prop
- [ ] 1.2.3 Verify PaymentProvider accepts apiService prop
- [ ] 1.2.4 Check usePaymentContext hook implementation
- [ ] 1.2.5 Verify error is thrown when hook used outside provider

---

## 2. Implementation

### 2.1 Add PaymentProvider to App.tsx
- [ ] 2.1.1 Import PaymentProvider from '../features/payment/contexts/PaymentProvider'
- [ ] 2.1.2 Import CrossmintService from '../features/payment/services/CrossmintService'
- [ ] 2.1.3 Create payment service instance: const paymentService = new CrossmintService()
- [ ] 2.1.4 Wrap entire AppWithProviders with PaymentProvider
- [ ] 2.1.5 Pass paymentService to PaymentProvider as apiService prop
- [ ] 2.1.6 Verify provider order is correct:
  ```
  PaymentProvider
  ├─ AuthProvider
  ├─ LanguageProvider
  └─ App
  ```

### 2.2 Verify Imports and Dependencies
- [ ] 2.2.1 Ensure all required imports are present in App.tsx
- [ ] 2.2.2 Verify no circular dependencies introduced
- [ ] 2.2.3 Check PaymentProvider component for TypeScript issues
- [ ] 2.2.4 Verify CrossmintService can be instantiated at this location

### 2.3 Code Quality Checks
- [ ] 2.3.1 No duplicate providers in hierarchy
- [ ] 2.3.2 No unnecessary nesting or wrapping
- [ ] 2.3.3 Comments added explaining provider purpose
- [ ] 2.3.4 Code follows project style conventions

---

## 3. Testing & Verification

### 3.1 Build & Compilation
- [ ] 3.1.1 Run npm run build - should succeed
- [ ] 3.1.2 TypeScript compilation - should pass with no errors
- [ ] 3.1.3 Check for console warnings during build
- [ ] 3.1.4 Verify bundle size increase is minimal

### 3.2 Local Development Testing
- [ ] 3.2.1 Start development server: npm run dev
- [ ] 3.2.2 Navigate to home page (should load without errors)
- [ ] 3.2.3 Check browser console for "usePaymentContext" error - should be gone
- [ ] 3.2.4 Verify no context-related errors in console
- [ ] 3.2.5 Verify LandingPage renders with HeaderBar visible
- [ ] 3.2.6 Verify HeaderBar shows PaymentModal button

### 3.3 Payment Functionality Testing
- [ ] 3.3.1 Click "积分套餐" button on header
- [ ] 3.3.2 PaymentModal should open without throwing error
- [ ] 3.3.3 Package selection interface should display
- [ ] 3.3.4 Verify payment context is accessible
- [ ] 3.3.5 Verify package selection state updates correctly
- [ ] 3.3.6 Test button click multiple times - no errors

### 3.4 Cross-Page Testing
- [ ] 3.4.1 Test payment button on home page
- [ ] 3.4.2 Test payment button on dashboard (if accessible)
- [ ] 3.4.3 Test payment button on different routes
- [ ] 3.4.4 Test modal open/close behavior
- [ ] 3.4.5 Verify modal state reset between opens

### 3.5 Accessibility Testing
- [ ] 3.5.1 Verify button is keyboard focusable
- [ ] 3.5.2 Verify modal opens with keyboard (Enter/Space)
- [ ] 3.5.3 Verify aria-labels are accessible
- [ ] 3.5.4 Test with screen reader simulation

### 3.6 Browser Compatibility Testing
- [ ] 3.6.1 Test in Chrome
- [ ] 3.6.2 Test in Firefox
- [ ] 3.6.3 Test in Safari
- [ ] 3.6.4 Test in Edge
- [ ] 3.6.5 Test on mobile browser

---

## 4. Deployment & Production Verification

### 4.1 Pre-Deployment Checks
- [ ] 4.1.1 Run full test suite (if exists)
- [ ] 4.1.2 Verify no breaking changes to existing functionality
- [ ] 4.1.3 Check git diff for unexpected changes
- [ ] 4.1.4 Verify git status is clean
- [ ] 4.1.5 Code review completed

### 4.2 Deploy to Vercel Production
- [ ] 4.2.1 Commit changes: fix: Add PaymentProvider to App.tsx
- [ ] 4.2.2 Deploy to Vercel production: vercel --prod
- [ ] 4.2.3 Verify build succeeds on Vercel
- [ ] 4.2.4 Verify deployment aliases to production URL
- [ ] 4.2.5 Check deployment logs for errors

### 4.3 Production Verification
- [ ] 4.3.1 Navigate to https://www.agentrade.xyz
- [ ] 4.3.2 Check browser console for errors (should be none)
- [ ] 4.3.3 Verify page loads correctly
- [ ] 4.3.4 Click "积分套餐" button
- [ ] 4.3.5 Verify PaymentModal opens without error
- [ ] 4.3.6 Verify no "usePaymentContext" error in console
- [ ] 4.3.7 Test package selection
- [ ] 4.3.8 Test modal close functionality

### 4.4 Performance Monitoring
- [ ] 4.4.1 Check load time didn't increase significantly
- [ ] 4.4.2 Verify memory usage is reasonable
- [ ] 4.4.3 Check Core Web Vitals metrics
- [ ] 4.4.4 Monitor error tracking for new errors

### 4.5 User Communication
- [ ] 4.5.1 Document fix in changelog
- [ ] 4.5.2 Update error tracking to mark issue as resolved
- [ ] 4.5.3 Monitor support channels for related issues

---

## Summary

**Total Tasks**: 60+ verification and implementation tasks
**Priority**: Critical (Blocks payment functionality)
**Complexity**: Low (Single provider addition)
**Risk**: Very Low (Only adds required wrapper)
**Estimated Implementation Time**: 30 minutes (code fix + testing)
**Estimated Deployment Time**: 10-15 minutes (Vercel build + verification)

