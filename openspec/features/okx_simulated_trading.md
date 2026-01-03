# OpenSpec: OKX Simulated Trading Support

## 1. Background
OKX provides a simulated trading environment that uses the same API endpoints as real trading but requires a specific HTTP header `x-simulated-trading` and dedicated simulated API keys. Users need a clear way to toggle between Real and Simulated modes when adding or editing an OKX exchange configuration.

## 2. Requirements
1.  **UI Enhancement:** In the "Add/Edit Exchange" modal, add a "Trading Mode" selection (Real Trading vs. Simulated Trading).
2.  **Terminology:** Use "Simulated Trading" (模拟盘) and "Real Trading" (实盘) instead of technical terms like "Testnet".
3.  **OKX Integration:**
    *   If "Real Trading" is selected: Header `x-simulated-trading: 0`.
    *   If "Simulated Trading" is selected: Header `x-simulated-trading: 1`.
4.  **KISS Principle:** Reuse the existing `testnet` boolean field in the database and API to represent this state (true = Simulated, false = Real).

## 3. Implementation Design

### 3.1 Backend: Update `OKXTrader`
*   **File:** `trader/okx_trader.go`
*   **Changes:**
    *   Add `isSimulated bool` field to `OKXTrader` struct.
    *   Initialize `isSimulated` from the `testnet` parameter in `NewOKXTrader`.
    *   Update `makeRequest` method to set `req.Header.Set("x-simulated-trading", "1")` if `isSimulated` is true, otherwise "0".

### 3.2 Frontend: Update `ExchangeConfigModal`
*   **File:** `web/src/components/AITradersPage.tsx`
*   **Changes:**
    *   Add a visual toggle or radio group for "Trading Mode".
    *   Specifically for OKX, ensure the simulated trading requirement (Simulated API Keys) is communicated.
    *   Map the UI selection to the `testnet` property in the `onSave` call.

### 3.3 Frontend: Update Translations
*   **File:** `web/src/i18n/translations.ts`
*   **Changes:**
    *   Add keys for `tradingMode`, `realTrading`, `simulatedTrading`, and OKX-specific hints.

## 4. Testing Plan
1.  **Unit Test for OKXTrader:** Mock the HTTP client and verify that the `x-simulated-trading` header is correctly set to "0" or "1" based on the configuration.
2.  **Manual Verification:** Add an OKX exchange in simulated mode and observe the logs to confirm the header is being sent.

## 5. Constraints
*   Do not break existing Binance or Hyperliquid configurations (which might already use the `testnet` flag).
