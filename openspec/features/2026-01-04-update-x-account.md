# OpenSpec: Update X (Twitter) Account Reference

## 1. Background
To reflect the new official social media handle, we need to update all references to the X (Twitter) account from `@AgenTrade` to `@EricBlock2100` and its corresponding URL.

## 2. Requirements
1.  **URL Update:** Change `https://x.com/AgenTrade` to `https://x.com/EricBlock2100`.
2.  **Handle Update:** Update any textual references from `@AgenTrade` to `@EricBlock2100`.
3.  **UI Consistency:** Ensure the footer and any community sections reflect the new handle.

## 3. Implementation Design

### 3.1 Frontend: Update `FooterSection.tsx`
*   **File:** `web/src/components/landing/FooterSection.tsx`
*   **Changes:** Update the `href` attribute for the X (Twitter) link.

### 3.2 Frontend: Update `CommunitySection.tsx`
*   **File:** `web/src/components/landing/CommunitySection.tsx`
*   **Changes:** Update the handle mentioned in the testimonial quote.

## 4. Testing Plan
1.  **Link Verification:** Click the X link in the footer to ensure it redirects to the correct profile.
2.  **Visual Check:** Verify the handle displayed in the community section is correct.
