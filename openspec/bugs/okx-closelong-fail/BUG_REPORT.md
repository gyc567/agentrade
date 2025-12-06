# Bug Report: OKX CloseLong/CloseShort Fails Due to Field Mismatch

## 1. Issue Description
The trader `TopTrader` failed to execute `close_long` for `BNBUSDT` with the error:
`❌ BNBUSDT close_long 失败: 没有找到多仓持仓`

However, the trader actually holds a position:
`BNB-USDT-SWAP 多头 826.3000 883.6000 6.0000 ...`

## 2. Root Cause Analysis
This is a regression caused by the recent fix in `parsePositions` (Bug Fix: OKX Position Reporting).

1.  **Previous Behavior**: `parsePositions` mapped the raw position amount string to the key `"position"`.
2.  **Current Behavior**: `parsePositions` now parses the amount into a `float64` and maps it to the key `"positionAmt"` (to align with `AutoTrader` expectations).
3.  **The Defect**: The `CloseLong` and `CloseShort` methods in `trader/okx_trader.go` were not updated to reflect this change. They still look for `pos["position"]` as a `string`.

```go
// Code in CloseLong (trader/okx_trader.go)
if size, ok := pos["position"].(string); ok { // Fails because key "position" does not exist
    positionSize, _ = strconv.ParseFloat(size, 64)
    break
}
```

Since `positionSize` remains 0, the method concludes that no position exists.

## 3. Fix Proposal
Update `CloseLong`, `CloseShort`, and `ClosePosition` in `trader/okx_trader.go` to:
1.  Read from the key `"positionAmt"`.
2.  Assert the type as `float64`.

```go
// Proposed Fix
if size, ok := pos["positionAmt"].(float64); ok {
    positionSize = size
    break
}
```

## 4. Verification
- After applying the fix, `CloseLong` should correctly identify the position size (e.g., 6.0000) and proceed to place the close order.
