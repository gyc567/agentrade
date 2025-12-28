## 1. Root Cause Diagnosis

### 1.1 Verify Production Deployment Status
- [ ] 1.1.1 Check current Vercel deployment URL and environment
- [ ] 1.1.2 Verify latest commit `6ed16f40` is deployed to production
- [ ] 1.1.3 Compare code commit timestamp vs. Vercel deployment timestamp
- [ ] 1.1.4 Check Vercel build logs for any failures or warnings
- [ ] 1.1.5 Verify correct project ID (prj_xMoVJ4AGtNNIiX6nN9uCgRop6KsP) is deployed

### 1.2 Investigate Deployment/Caching Issue (Cause 1)
- [ ] 1.2.1 Fetch production HTML from https://www.agentrade.xyz
- [ ] 1.2.2 Search HTML for "积分套餐" or "Packages" button code
- [ ] 1.2.3 Check if button HTML exists in production source
- [ ] 1.2.4 Verify Vercel CDN cache status and cache control headers
- [ ] 1.2.5 Clear Vercel cache if button code not found in production
- [ ] 1.2.6 Force redeploy from Vercel if code not deployed
- [ ] 1.2.7 Verify button appears after cache clear/redeploy

### 1.3 Investigate Condition Rendering Issue (Cause 2)
- [ ] 1.3.1 Check Header.tsx line 50-67 for `{!simple && }` wrapper presence
- [ ] 1.3.2 Compare button wrapper consistency with CreditsDisplay (line 48) and email (lines 41-44)
- [ ] 1.3.3 Identify all page types and their `simple` prop values
- [ ] 1.3.4 Test button visibility on dashboard page (simple={false})
- [ ] 1.3.5 Test button visibility on login/register pages (simple={true})
- [ ] 1.3.6 Add `{!simple && }` wrapper to button if missing (Cause 2 fix)

### 1.4 Investigate Style/Visibility Issue (Cause 3)
- [ ] 1.4.1 Inspect CSS computed styles on button in production
- [ ] 1.4.2 Check if button has `display: none` or `visibility: hidden` applied
- [ ] 1.4.3 Verify flex container dimensions and overflow properties
- [ ] 1.4.4 Check z-index stacking context for visibility conflicts
- [ ] 1.4.5 Verify button element has proper width/height in DOM
- [ ] 1.4.6 Check for CSS transitions or animations hiding button
- [ ] 1.4.7 Test button in mobile/tablet viewport sizes

---

## 2. Root Cause Fixes

### 2.1 Fix Deployment/Caching Issue (Cause 1)
- [ ] 2.1.1 If code not in production HTML: Force Vercel rebuild and deployment
- [ ] 2.1.2 Verify production source code includes button after rebuild
- [ ] 2.1.3 Clear browser local storage and Service Worker caches
- [ ] 2.1.4 Test button visibility in incognito/private window (fresh cache)
- [ ] 2.1.5 Generate public cache invalidation instructions for users

### 2.2 Fix Condition Rendering Issue (Cause 2)
- [ ] 2.2.1 Edit Header.tsx: Wrap button in `{!simple && }` condition
- [ ] 2.2.2 Ensure button renders on dashboard (simple={false}) pages
- [ ] 2.2.3 Ensure button does NOT render on login/register (simple={true}) pages
- [ ] 2.2.4 Test button visibility across all page types after fix
- [ ] 2.2.5 Commit and deploy fix to Vercel

### 2.3 Fix Style/Visibility Issue (Cause 3)
- [ ] 2.3.1 If button hidden by overflow: Check flex container `overflow-x` property
- [ ] 2.3.2 If button clipped: Adjust padding/margin or flex layout
- [ ] 2.3.3 If z-index issue: Verify stacking context and adjust z-index if needed
- [ ] 2.3.4 Test button visibility in all viewport sizes (mobile, tablet, desktop)
- [ ] 2.3.5 Verify no CSS conflicts from Tailwind classes or inline styles

---

## 3. Testing & Verification

### 3.1 Production Verification
- [ ] 3.1.1 Verify button appears at https://www.agentrade.xyz after all fixes
- [ ] 3.1.2 Test button click opens PaymentModal
- [ ] 3.1.3 Verify button styling (blue #007bff background, white text)
- [ ] 3.1.4 Test hover effect (color changes to #0056b3)
- [ ] 3.1.5 Test language switching (text updates to correct language)

### 3.2 Browser & Device Testing
- [ ] 3.2.1 Test button visibility in Chrome desktop
- [ ] 3.2.2 Test button visibility in Firefox desktop
- [ ] 3.2.3 Test button visibility in Safari desktop
- [ ] 3.2.4 Test button visibility in mobile Safari (iOS)
- [ ] 3.2.5 Test button visibility in Chrome mobile (Android)
- [ ] 3.2.6 Test button visibility on tablet devices

### 3.3 Cache & Network Testing
- [ ] 3.3.1 Test button visibility with empty browser cache (Ctrl+Shift+Delete)
- [ ] 3.3.2 Test button visibility in incognito/private mode
- [ ] 3.3.3 Test button visibility on slow 3G network (DevTools throttling)
- [ ] 3.3.4 Verify Service Worker does not cache old version

### 3.4 Accessibility Verification
- [ ] 3.4.1 Verify button is keyboard focusable (Tab navigation)
- [ ] 3.4.2 Verify button can be activated with Enter key
- [ ] 3.4.3 Verify button aria-label is correct
- [ ] 3.4.4 Verify button title tooltip displays on hover
- [ ] 3.4.5 Test with screen reader (accessibility tree shows button)

---

## 4. Documentation & Deployment

### 4.1 Root Cause Documentation
- [ ] 4.1.1 Document which of the 3 causes was the actual root cause
- [ ] 4.1.2 Document the fix applied for the root cause
- [ ] 4.1.3 Document any secondary issues found during diagnosis
- [ ] 4.1.4 Create user communication if cache clearing needed

### 4.2 Final Deployment
- [ ] 4.2.1 Ensure all fixes are committed to git
- [ ] 4.2.2 Verify build passes TypeScript compilation
- [ ] 4.2.3 Verify production build completes without errors
- [ ] 4.2.4 Deploy to Vercel production
- [ ] 4.2.5 Verify deployment successful in Vercel dashboard

---

## Summary

**Total Tasks**: 39 tasks
**Priority**: High (blocks feature visibility in production)
**Complexity**: Medium (3 diagnostic paths, targeting each root cause)
**Estimated Timeline**: Diagnostic phase 1-2 hours, fix phase 30 minutes-1 hour depending on root cause

