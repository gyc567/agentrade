# Feature Proposal: Rebranding nofx_ai to AgenTrade

## 1. Context & Objectives
The project is rebranding. We need to replace all occurrences of the legacy handle "nofx_ai" with the new brand name "AgenTrade" in the frontend display.

## 2. Scope
-   **Target String**: `nofx_ai` (case-insensitive for search, but replacement is specific).
-   **Files Identified**:
    -   `web/src/components/landing/CommunitySection.tsx` (Text content).
    -   `web/src/components/landing/FooterSection.tsx` (URL).

## 3. Changes

### 3.1 `web/src/components/landing/CommunitySection.tsx`
-   **Current**: `... @nofx_ai ...`
-   **New**: `... @AgenTrade ...`

### 3.2 `web/src/components/landing/FooterSection.tsx`
-   **Current**: `href='https://x.com/nofx_ai'`
-   **New**: `href='https://x.com/AgenTrade'`

## 4. Verification
-   Build verification (`npm run build --prefix web`).
-   Manual review of changed files.
-   Search verification (ensure 0 matches for `nofx_ai` in `web/src`).

## 5. Principles
-   **KISS**: Direct string replacement.
-   **Clean Code**: No logic changes, just content update.
