# Bug Proposal: User Credits Not Displaying Properly on Production

## 1. Problem Description
Users reported that after logging in to `https://www.agentrade.xyz/`, the available credits are not displayed correctly in the top-right corner (next to the language switcher). Investigation reveals several technical issues ranging from CSS Module misuse to architectural duplication and configuration errors.

## 2. Identified Causes

### Cause 1: CSS Module Class Name Mismatch (Styling)
The `CreditsDisplay` component and its subcomponents use kebab-case class names as string literals (e.g., `credits-display`), while the imported `credits.module.css` defines them in camelCase (e.g., `.creditsDisplay`).
- **Result:** Since it's a CSS module, class names are hashed at build time. The string literals do not match the hashed names, causing the component to have no styling. It may appear as unstyled text or be invisible.

### Cause 2: Redundant and Conflicting Hook Definitions (Architectural)
There are two `useUserCredits` hooks in the codebase:
1. `web/src/hooks/useUserCredits.ts`
2. `web/src/hooks/useUserProfile.ts`
- **Result:** These hooks have different return structures and implementation details (one uses SWR, the other uses `useEffect`). This duplication creates confusion and makes maintenance difficult.

### Cause 3: API Base URL Resolution (Environment)
The `getApiBaseUrl` function in `apiConfig.ts` only uses a relative path (`/api`) if the hostname contains `.replit.app`.
- **Result:** On a custom domain like `agentrade.xyz`, it falls back to a hardcoded Replit URL if `VITE_API_URL` is not set. This can lead to CORS issues or requests being sent to the wrong backend environment.

## 3. Proposed Solution

### Fix 1: Correct CSS Module Usage
Refactor `CreditsDisplay.tsx`, `CreditsIcon.tsx`, and `CreditsValue.tsx` to use the `styles` object from `credits.module.css`. Ensure class names match exactly.

### Fix 2: Consolidate Hooks
Remove the redundant `useUserCredits` hook from `useUserProfile.ts`. Standardize on the dedicated `useUserCredits.ts` hook. Update the return structure to be consistent and include all necessary fields.

### Fix 3: Robust API URL Resolution
Update `getApiBaseUrl` to handle custom domains by defaulting to relative paths when running in a browser environment, or by explicitly checking for the production domain.

## 4. Implementation Steps

1. **Update `CreditsDisplay.tsx`** and its subcomponents to correctly use CSS module styles.
2. **Refactor `useUserCredits.ts`** to be more robust and potentially use SWR for consistency with other hooks.
3. **Clean up `useUserProfile.ts`** by removing the duplicate hook.
4. **Update `apiConfig.ts`** to ensure correct API base URL resolution on production.

## 5. Verification Plan
- Check local development environment.
- Verify that `credits-display` class is correctly applied (hashed) in the DOM.
- Verify API requests are sent to the correct URL in the Network tab.
- Verify that credits display shows `-` when logged out and actual values when logged in.
