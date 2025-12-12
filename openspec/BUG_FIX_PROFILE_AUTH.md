# Bug Proposal: Fix Unauthenticated Access to Profile Page

## 1. Issue Description
Users are seeing "Login expired" error messages on the Profile page instead of being redirected to the login/landing page.
This happens because the `/profile` route handling in `App.tsx` occurs *before* the global authentication check.

## 2. Root Cause
In `web/src/App.tsx`:
```typescript
  // User Profile Page Route
  if (route === '/profile') {
    return ( ... );
  }

  // Show main app for authenticated users on other routes
  if (!user || !token) {
    return <LandingPage />;
  }
```
If a user is logged out (e.g. token expired and `logout()` called), `user` is null. But since `route` is still `/profile`, the app renders `UserProfilePage` with a null user context, leading to API errors ("Login expired") instead of the Landing Page.

## 3. Solution
Move the `/profile` route logic **after** the authentication check. This ensures that only authenticated users can access the profile page. If not authenticated, they will fall through to the `LandingPage`.

## 4. Implementation Plan
1.  Modify `web/src/App.tsx`.
2.  Move the `if (route === '/profile')` block to be after `if (!user || !token)`.

## 5. Verification
-   **Manual**:
    1.  Log in. Go to `/profile`.
    2.  Clear `localStorage` (simulate logout/expiry). Refresh.
    3.  Should see Landing Page, not Profile Page with errors.
