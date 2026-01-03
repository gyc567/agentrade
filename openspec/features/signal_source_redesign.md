# OpenSpec: Redesigned Signal Source Configuration

## 1. Background
The current signal source configuration (Coin Pool and OI Top) uses global variables in the backend, which is not thread-safe for multi-user environments and lacks flexibility. The UI implementation in the "Add Trader" popup was also tightly coupled and hardcoded.

## 2. Requirements
1.  **Isolation:** Signal source configurations must be isolated per trader/user. No global state in the `pool` package.
2.  **Flexibility:** Support enabling/disabling "Coin Pool" and "OI Top" independently for each trader.
3.  **KISS Design:** Maintain simple boolean toggles in the Trader configuration but ensure the backend correctly routes the user-specific URLs.
4.  **Clean Code:** High cohesion in the `pool` package, low coupling with the `trader` package.
5.  **Testing:** 100% test coverage for new/refactored code.

## 3. Implementation Design

### 3.1 Backend: Refactor `pool` Package
*   **File:** `pool/coin_pool.go`
*   **Changes:**
    *   Encapsulate `CoinPool` and `OITop` fetching logic into a `SignalProvider` struct.
    *   Remove global `coinPoolConfig` and `oiTopConfig`.
    *   Methods like `GetCoinPool`, `GetOITopPositions`, and `GetMergedCoinPool` will now be methods of `SignalProvider` or accept a config object.

### 3.2 Backend: Update `AutoTrader`
*   **File:** `trader/auto_trader.go`
*   **Changes:**
    *   Update `AutoTraderConfig` to include `OITopAPIURL`.
    *   Update `NewAutoTrader` to stop calling global `pool.SetCoinPoolAPI`.
    *   Update `AutoTrader.getCandidateCoins` to use a `pool.SignalProvider` initialized with the trader's specific URLs.

### 3.3 Backend: Update `TraderManager`
*   **File:** `manager/trader_manager.go`
*   **Changes:**
    *   Ensure `OITopURL` is correctly passed to the trader configuration (currently it is fetched from DB but not used).

### 3.4 Frontend: Redesign UI
*   **File:** `web/src/components/TraderConfigModal.tsx`
*   **Changes:**
    *   Re-implement the "Signal Sources" section with a cleaner layout.
    *   Ensure proper state management for `use_coin_pool` and `use_oi_top`.

## 4. Testing Plan
1.  **Unit Tests for `pool`:** Create tests for `SignalProvider` ensuring it correctly uses provided URLs and handles errors/caching without global state.
2.  **Unit Tests for `AutoTrader`:** Verify that `getCandidateCoins` correctly uses the configured URLs.
3.  **Integration Test:** Verify end-to-end flow from UI to trader execution.

## 5. Constraints
*   Must not break existing "TopTrader" functionality.
*   Maintain 100% test coverage for all new logic.
