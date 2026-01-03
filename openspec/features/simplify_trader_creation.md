# OpenSpec: Simplify Trader Creation UI

## 1. Background
To adhere to the KISS (Keep It Simple, Stupid) principle, we want to streamline the "Add Trader" workflow. The "Signal Source Configuration" section, while functional, adds cognitive load during the initial setup. Most users prefer the best defaults (AI500 + OI Top) automatically.

## 2. Requirements
1.  **UI Simplification:** Remove the "📡 信号源配置" section from the `TraderConfigModal` component.
2.  **Smart Defaults:** New traders created via this modal should have `use_coin_pool` and `use_oi_top` set to `true` by default to ensure optimal AI performance.
3.  **Clean Code:** Completely remove the UI code while keeping the state management for data integrity.

## 3. Implementation Design

### 3.1 Frontend: Update `TraderConfigModal`
*   **File:** `web/src/components/TraderConfigModal.tsx`
*   **Changes:**
    *   Remove the JSX section for "Signal Sources".
    *   Ensure `formData` defaults for `use_coin_pool` and `use_oi_top` are set to `true` in the `useEffect` initialization and the initial state.

### 3.2 Frontend: Update `TraderConfigViewModal` (Optional)
*   Keep the display in the view-only modal so users can still see that these sources are active, even if they didn't manually toggle them during creation.

## 4. Testing Plan
1.  **Creation Test:** Create a new trader and verify via the "View Configuration" modal or API that `use_coin_pool` and `use_oi_top` are indeed `true`.
2.  **UI Regression:** Ensure the modal layout remains balanced after removal.

## 5. Constraints
*   Do not change the backend database schema.
*   Existing traders' configurations must remain untouched.
