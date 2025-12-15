# Feature Proposal: Mlion Configuration Migration Script

## 1. Context & Objectives
To facilitate the deployment of the Mlion News feature, we need a reliable way to apply the database configuration migration (`20251215_mlion_news_config.sql`) without manual SQL console access.
The script will reside in the renamed `resetUserAndSystemDB` directory, expanding its scope from password reset to general system maintenance.

## 2. Technical Design

### 2.1 Script Location
-   **Path**: `resetUserAndSystemDB/apply_mlion_config.go`
-   **Package**: `main` (standalone executable).

### 2.2 Functionality
1.  **Initialize DB Connection**: Reuse `nofx/config.NewDatabase` to connect to the target database (PostgreSQL/Neon) using environment variables (`DATABASE_URL`).
2.  **Read Migration File**: Read the content of `database/migrations/20251215_mlion_news_config.sql`.
3.  **Execute Migration**: Run the SQL commands against the database.
4.  **Verification**: Log the result (Success/Failure) and potentially verify the inserted values.

### 2.3 Design Principles (KISS & Cohesion)
-   **Simple**: The script does one thing: applies the specific config.
-   **Robust**: Handles connection errors and file read errors.
-   **Safe**: The SQL uses `ON CONFLICT` to ensure idempotency. Rerunning the script is safe.
-   **Decoupled**: It does not import the `news` service or other business logic, only the database infrastructure.

## 3. Implementation Plan

### Phase 1: Implementation
-   Create `resetUserAndSystemDB/apply_mlion_config.go`.
-   Implement `main` function to:
    -   Load DB.
    -   Execute SQL string (hardcoded or read from file - hardcoding the specific SQL ensures the script is self-contained artifact if moved). *Decision: Embed the SQL content in the Go file for maximum portability and simplicity (KISS).*

### Phase 2: Testing
-   Create `resetUserAndSystemDB/apply_mlion_config_test.go`.
-   Test connection logic (mock or integration if DB available).
-   Verify that after execution, `GetSystemConfig("mlion_news_enabled")` returns "true".

## 4. Verification
-   Run the script locally with `DATABASE_URL` set.
-   Check `diagnose_mlion.go` output afterwards to confirm success.
