# Frontend Dashboard Spec Delta: Fix TopTrader Zero Display

## MODIFIED Requirements

### Competition Page Data Display
**Requirement:** The CompetitionPage component must fetch and display accurate TopTrader metrics from the backend API.

#### Scenario: Display TopTrader with correct values
**Given** the TopTrader exists with real trading data
**When** the CompetitionPage loads
**Then** it should fetch data from `/api/competition` endpoint
**And** display the following metrics for TopTrader:
- Total Equity: 99.88 USDT (not 0.00)
- Available Balance: 99.88 USDT (not 0.00)
- Total P&L: -0.12 USDT (not 0.00)
- Position Count: 0

#### Scenario: Handle data loading states
**Given** the CompetitionPage is loading
**When** the API request is in progress
**Then** it should show loading skeleton/spinner
**And** not display zeros for any metrics

#### Scenario: Debug data flow
**Given** the CompetitionPage component
**When** rendering with competition data
**Then** it should log to console:
- Competition data object
- Traders array
- Individual TopTrader equity value
- This enables troubleshooting display issues

## Implementation Details

### File: `web/src/components/CompetitionPage.tsx`

**Changes:**
- Added debug logging after SWR data fetch (line 27-32)
- Logs competition data, traders array, and TopTrader equity
- Helps identify if issue is in data fetch or rendering

**Debug Logs Added:**
```typescript
console.log('🔍 Debug - Competition data:', competition);
console.log('🔍 Debug - Traders:', competition?.traders);
if (competition?.traders?.[0]) {
  console.log('🔍 Debug - TopTrader equity:', competition.traders[0].total_equity);
}
```

## Testing

### Production Test
1. Deploy to: https://web-fco5upt1e-gyc567s-projects.vercel.app
2. Open browser DevTools → Console
3. Look for debug output showing actual data values
4. Verify display matches backend API (99.88 USDT not 0.00)

### Backend API Reference
```bash
# Competition data endpoint
curl https://nofx-gyc567.replit.app/api/competition
# Returns: {"count": 1, "traders": [{"total_equity": 99.883, ...}]}

# TopTrader account endpoint
curl https://nofx-gyc567.replit.app/api/account?trader_id=okx_admin_deepseek_1763601659
# Returns: {"total_equity": 99.882, "available_balance": 99.882, ...}
```

## Validation

### Post-Fix Criteria
- [ ] Debug logs present in code (for troubleshooting)
- [ ] Production shows real values (99.88 USDT) not zeros
- [ ] Browser console shows debug output with correct data
- [ ] No JavaScript errors in console
- [ ] Data matches backend API responses

## Notes

This is a **debug-first** approach to identify root cause of display issue:
1. Deploy with debug logging
2. Check console for actual data flow
3. Identify where data is lost/transformed
4. Apply targeted fix based on findings
5. Remove debug logs after resolution
