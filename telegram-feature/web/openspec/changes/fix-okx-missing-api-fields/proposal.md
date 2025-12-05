# Proposal: Fix OKX Missing API Key and Secret Key Fields

## Summary

Fix a bug where the OKX Futures exchange configuration modal does not display API Key and Secret Key input fields, preventing users from configuring their OKX API credentials.

## Problem Description

When users navigate to:
1. `/traders` page
2. Click "Exchanges" → "Add Exchange"
3. Select "OKX Futures" from the dropdown

The configuration modal appears but is missing essential fields:
- **Missing**: API Key input field
- **Missing**: Secret Key input field
- **Present**: Passphrase input field (correctly shown)

Comparison with "Binance Futures":
- Binance correctly shows: API Key, Secret Key, and Passphrase fields
- OKX only shows: Passphrase field

This prevents users from configuring OKX exchange credentials.

## Root Cause Analysis

### Data Layer Issue
- Database `config.db` stores OKX exchange with `type = 'okx'` (not 'cex')
- Location: `exchanges` table, record with `id = 'okx'`, `user_id = 'default'`

### Frontend Code Issue
File: `src/components/AITradersPage.tsx`, line 1291

```typescript
{(selectedExchange.id === 'binance' || selectedExchange.type === 'cex') && selectedExchange.id !== 'hyperliquid' && selectedExchange.id !== 'aster' && (
```

**Problem**: The conditional logic only displays API Key/Secret Key for:
- Exchanges with `id === 'binance'`
- OR exchanges with `type === 'cex'`

But OKX has `type = 'okx'`, so it fails both conditions and is excluded.

The code later (line 1323) has a special case for OKX passphrased:
```typescript
{selectedExchange.id === 'okx' && (
```

This suggests OKX was intended to have credentials, but the main condition excludes it.

## Proposed Solution

### Option 1: Update Database Type (Recommended)
Change OKX exchange type from `'okx'` to `'cex'` in database:
```sql
UPDATE exchanges SET type = 'cex' WHERE id = 'okx' AND user_id = 'default';
```

**Pros**:
- Minimal code change
- Consistent with other CEX exchanges
- Aligns with type definition comment: `-- 'cex' or 'dex'`

**Cons**:
- Requires database migration

### Option 2: Update Frontend Condition
Modify the conditional in `AITradersPage.tsx` line 1291 to include OKX:
```typescript
{(selectedExchange.id === 'binance' ||
  selectedExchange.type === 'cex' ||
  selectedExchange.id === 'okx') &&
  selectedExchange.id !== 'hyperliquid' &&
  selectedExchange.id !== 'aster' && (
```

**Pros**:
- No database changes needed
- Explicit handling of OKX

**Cons**:
- Code becomes more complex
- Each new exchange requires explicit handling

## Recommendation

**Use Option 1** (Update Database Type) because:
1. OKX is a Centralized Exchange (CEX), so `'cex'` is semantically correct
2. Reduces frontend code complexity
3. Consistent with type system design
4. Easier maintenance

## Implementation Tasks

See `tasks.md` for detailed implementation steps.

## Validation

After implementation, verify:
1. ✅ Select "OKX Futures" → Modal shows API Key, Secret Key, Passphrase fields
2. ✅ Users can successfully save OKX configuration
3. ✅ Other exchanges (Binance, Hyperliquid, Aster) still work correctly
4. ✅ Frontend form validation works for all three fields

## References

- Database schema: `config/database.go:67-85`
- Exchange config modal: `src/components/AITradersPage.tsx:1148-1491`
- API endpoint: `GET /api/supported-exchanges`
