## 1. Implementation

### 1.1 Header Component
- [ ] 1.1.1 Modify src/components/Header.tsx to add packages button
- [ ] 1.1.2 Position button between CreditsDisplay and Language Toggle
- [ ] 1.1.3 Implement click handler to open PaymentModal
- [ ] 1.1.4 Add dynamic text (Chinese/English support)
- [ ] 1.1.5 Implement hover effect (#007bff → #0056b3)
- [ ] 1.1.6 Add aria-label for accessibility
- [ ] 1.1.7 Add title attribute for tooltip

### 1.2 Internationalization
- [ ] 1.2.1 Check if i18n translations already exist
- [ ] 1.2.2 Add translations if needed (packagesButton, packagesButtonHint, etc.)
- [ ] 1.2.3 Update translations.ts with Chinese and English labels

### 1.3 Styling
- [ ] 1.3.1 Apply correct padding (px-4 py-2)
- [ ] 1.3.2 Apply correct colors (#007bff background, white text)
- [ ] 1.3.3 Apply border radius (4px)
- [ ] 1.3.4 Ensure responsive design on mobile

---

## 2. Testing

### 2.1 Functional Testing
- [ ] 2.1.1 Verify button appears in correct position
- [ ] 2.1.2 Verify clicking button opens PaymentModal
- [ ] 2.1.3 Verify PaymentModal displays correctly
- [ ] 2.1.4 Verify user can select package and complete payment flow
- [ ] 2.1.5 Verify button text changes when language is switched
- [ ] 2.1.6 Verify button displays for both logged in and logged out users

### 2.2 Accessibility Testing
- [ ] 2.2.1 Verify button is focusable with Tab key
- [ ] 2.2.2 Verify button can be activated with Enter key
- [ ] 2.2.3 Verify button can be activated with Space key
- [ ] 2.2.4 Verify aria-label is correct
- [ ] 2.2.5 Verify title attribute shows tooltip
- [ ] 2.2.6 Test with screen reader (NVDA/JAWS simulation)

### 2.3 Visual Testing
- [ ] 2.3.1 Verify button styling (colors, padding, border-radius)
- [ ] 2.3.2 Verify hover effect works correctly
- [ ] 2.3.3 Verify focus indicator is visible
- [ ] 2.3.4 Verify spacing with adjacent elements
- [ ] 2.3.5 Verify responsive design on mobile (layout doesn't break)

### 2.4 Integration Testing
- [ ] 2.4.1 Verify no conflicts with existing Header features
- [ ] 2.4.2 Verify PaymentModal integration works correctly
- [ ] 2.4.3 Verify language switching still works
- [ ] 2.4.4 Verify credits display still works
- [ ] 2.4.5 Verify all three buttons (credits, packages, language) work together

---

## 3. Build & Deployment

### 3.1 Pre-Deployment
- [ ] 3.1.1 Run TypeScript compilation (npm run tsc)
- [ ] 3.1.2 Run Vite production build (npm run build)
- [ ] 3.1.3 Verify no TypeScript errors
- [ ] 3.1.4 Verify no console warnings
- [ ] 3.1.5 Check bundle size increase

### 3.2 Deployment
- [ ] 3.2.1 Deploy to Vercel staging
- [ ] 3.2.2 Test on staging URL
- [ ] 3.2.3 Deploy to production with Vercel CLI
- [ ] 3.2.4 Verify production deployment successful
- [ ] 3.2.5 Test all features on live site

### 3.3 Post-Deployment
- [ ] 3.3.1 Verify button appears on live site
- [ ] 3.3.2 Test complete payment flow on production
- [ ] 3.3.3 Monitor error logs for any issues
- [ ] 3.3.4 Verify no performance regressions
- [ ] 3.3.5 Collect initial user feedback

---

## Summary

**Total Tasks**: 30 tasks
**Complexity**: Low (single component change)
**Risk Level**: Low (no breaking changes, purely additive)
**Estimated Time**: 2-3 hours (implementation, testing, deployment)
