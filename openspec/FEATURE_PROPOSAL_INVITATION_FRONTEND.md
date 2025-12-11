# Feature Proposal: Invitation System Frontend Integration

## 1. Context & Objectives
To complete the Invitation System, we need to expose the user's invite code and referral link on the frontend.
- **Location**: User Profile Page (`/profile`).
- **Functionality**: View Invite Code, Copy Invite Code, Copy Referral Link.
- **Principles**: KISS, High Cohesion, Low Coupling.

## 2. Technical Architecture

### 2.1 Types Update
Update the frontend `User` interface to include the new field `invite_code`.

**File: `web/src/types.ts`**
```typescript
export interface User {
  id: string;
  email: string;
  invite_code?: string; // New optional field
  // ... other fields
}
```

### 2.2 Component Changes
**File: `web/src/pages/UserProfilePage.tsx`**
- Add a new "Invitation Center" card.
- Display `user.invite_code`.
- Add a "Copy" button for the code.
- Construct the referral link: `${window.location.origin}/register?inviteCode=${user.invite_code}`.
- Add a "Copy Link" button.

**File: `web/src/contexts/AuthContext.tsx`**
- Ensure the `user` object returned from `/api/login` and `/api/register` includes `invite_code` and is stored correctly in state/localStorage.

**File: `web/src/components/RegisterPage.tsx`**
- Read `inviteCode` from URL query parameters.
- Pre-fill the "Invitation Code" input field (if implemented, or add it).
- Submit `invite_code` to the backend during registration.

## 3. Implementation Plan

1.  **Update Types**: `web/src/types.ts`.
2.  **Update Register Page**: `web/src/components/RegisterPage.tsx` to handle `inviteCode` param and input.
3.  **Update Profile Page**: `web/src/pages/UserProfilePage.tsx` to display code/link.
4.  **Verify Auth Context**: Check if `AuthContext` needs adjustment (it likely just stores what API returns, so minimal change if API returns it).

## 4. Verification & Testing

1.  **Unit Tests**: Test UI rendering of the invite code.
2.  **Manual Verification**:
    -   Login -> Check Profile -> See Code.
    -   Copy Link -> Open Incognito -> Check Register Page pre-fill.
    -   Register -> Verify backend creates relationship (already tested).

## 5. Security
- Invite code is public information (for the user), so displaying it is safe.
- XSS prevention: React handles string escaping by default.

