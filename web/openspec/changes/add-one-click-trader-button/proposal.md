## Why

Logged-in users must currently leave the monitoring views and open the trader configuration page before they can create a new trader. The new release needs a "一键生成交易员" shortcut that is always available in the header so operators can immediately spin up a trader without disrupting their workflow.

## What Changes

- Add a dedicated "一键生成交易员 / One-Click Trader" action to the authenticated navigation header (desktop + mobile)
- Place the button immediately to the left of the existing 实时/Reatime tab so it is visible in the upper-right corner after login
- Reuse the existing `TraderConfigModal` for the modal UI, but open it directly from the header shortcut
- Auto-load the enabled AI models/exchanges and limit model choices to platform-provided models (currently DeepSeek and Gemini)
- Keep the modal behavior identical to the existing create-trader experience, including validations and API submission
- Provide a11y labels plus responsive behavior that matches current navigation elements

## Impact

- **Affected specs**: `header-navigation`
- **Affected code**:
  - `web/src/components/landing/HeaderBar.tsx`
  - `web/src/components/TraderConfigModal.tsx` (reused via new entry point)
  - `web/src/lib/api.ts` (existing create trader API usage)
  - `web/src/i18n/translations.ts`
  - `web/src/components/__tests__/HeaderBar.one-click.test.tsx`
- **Testing**: vitest component tests covering the new button + modal wiring
- **Risks**: Medium — touches shared header; mitigated through tests and isolated state
