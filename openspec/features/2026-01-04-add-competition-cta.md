# OpenSpec: Add "Explore Competition" CTA to Landing Page

## 1. Background
With the removal of the "View Source Code" button, the landing page hero section feels less balanced. Since our platform features a live AI trading competition, adding a direct link to the competition page will increase user engagement and showcase our core technology immediately.

## 2. Requirements
1.  **UI Addition:** Add an "Explore Competition" button next to the "Get Started Now" button in the Hero Section.
2.  **Functionality:** Clicking the button should navigate the user to the `/competition` page.
3.  **Styling:** Use a secondary button style (outline) to contrast with the primary "Get Started" button.
4.  **Localization:** Support English ("Explore Competition") and Chinese ("探索实时竞赛").

## 3. Implementation Design

### 3.1 Internationalization
*   **File:** `web/src/i18n/translations.ts`
*   **Keys to add:** `exploreCompetition`

### 3.2 Frontend: Update `HeroSection.tsx`
*   **File:** `web/src/components/landing/HeroSection.tsx`
*   **Changes:**
    *   Import `Trophy` icon from `lucide-react`.
    *   Add the new button component with a link to `/competition`.

## 4. Testing Plan
1.  **Navigation:** Verify that clicking the button redirects to the competition page.
2.  **Visuals:** Check responsiveness on mobile and desktop.
