# Bug Report: Schema Synchronization Issue

## Issue ID
`AGENTRADE-DB-001`

## Title
Column "override_base_prompt" does not exist - Schema version mismatch between migration.sql and database.go

## Severity
🔴 **Critical**

## Description
Application fails to start with error: `pq: column "override_base_prompt" does not exist`

### Root Cause Analysis

#### Problem 1: Dual Schema Definition
- **Location A**: `database/migration.sql` (NEW) - Defines `override_base_prompt` column in CREATE TABLE statement
- **Location B**: `config/database.go` (OLD) - Attempts to ADD the same column via ALTER TABLE

When using the new unified migration script:
1. All columns are created during `CREATE TABLE` (Line 87 in migration.sql)
2. Application then calls `alterTables()` which tries `ALTER TABLE traders ADD COLUMN override_base_prompt`
3. Column already exists, but error handling might not catch all cases properly

#### Problem 2: Error Handling Gap
- `alterTables()` function (Line 486) calls `d.exec(query)` without checking return value
- PostgreSQL error messages might not always be caught when column already exists
- Some edge cases with duplicate column definitions could slip through

#### Problem 3: Multiple Column Conflicts
Lines 464-474 in `config/database.go` attempt to add these columns that are already in migration.sql:
- `custom_prompt`
- `override_base_prompt` ← **Primary Error**
- `is_cross_margin`
- `use_default_coins`
- `custom_coins`
- `btc_eth_leverage`
- `altcoin_leverage`
- `trading_symbols`
- `use_coin_pool`
- `use_oi_top`
- `system_prompt_template`

## Impact
- ✗ Application startup fails
- ✗ Database initialization broken
- ✗ Replit deployment blocked
- ✓ Local development with old SQLite works (falls back to SQLite)

## Solution

### Option 1: Remove Redundant ALTER TABLE Statements (RECOMMENDED)
Since the new unified `migration.sql` handles all table creation with complete schema, remove the duplicate ALTER TABLE commands that are no longer needed.

### Option 2: Add IF NOT EXISTS Check
Wrap each ALTER TABLE in a more robust error-handling mechanism.

### Implementation
We choose **Option 1** because:
1. New unified migration script is the source of truth
2. `alterTables()` becomes legacy code if using migration.sql
3. Cleaner, more maintainable solution
4. No redundant operations

---

## Changes Required

### File: config/database.go

**Lines to Remove/Comment**: 464-474
These ALTER TABLE statements for traders table columns are redundant.

**Rationale**: All these columns are now defined in `database/migration.sql` at table creation time.

---

