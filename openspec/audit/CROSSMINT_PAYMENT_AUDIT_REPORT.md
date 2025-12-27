# OpenSpec Audit Report: Crossmint Web3 USDT Payment Module

**Date:** 2025-12-25
**Auditor:** Gemini Agent
**Status:** Conceptual Audit (Proposal File Not Found)
**Target:** Integration of Crossmint for USDT Payments into `nofx` Credits System

## 1. Executive Summary

This audit evaluates the proposed integration of Crossmint as a Web3 payment gateway for the existing Credits System. While the specific proposal file was not found in the codebase, this audit analyzes the architectural fit, security implications, and implementation requirements based on the existing `config/CREDITS_SYSTEM.md` and standard Crossmint integration patterns.

**Verdict:** **RECOMMENDED WITH CAUTION**
The integration is technically feasible and aligns well with the existing `credit_packages` architecture. Primary risks involve webhook security and transaction state synchronization.

## 2. Architectural Analysis

### 2.1 Component Interaction
*   **Frontend (`web/src`)**: Needs to implement the Crossmint Payment Element/SDK. It will initiate the checkout process using `credit_packages.price_usdt` and `credit_packages.id` as metadata.
*   **Backend (`nofx-backend`)**: Requires a new API endpoint (e.g., `POST /api/webhooks/crossmint`) to handle asynchronous payment notifications.
*   **Database (`config/database.go`)**: Existing methods (`AddCredits`, `GetPackageByID`) are sufficient. No schema changes are strictly required, though adding a `payment_provider` column to `credit_transactions` could be beneficial for analytics.

### 2.2 Data Flow
1.  **User** selects a package in Frontend.
2.  **Frontend** initializes Crossmint Checkout with `packageId`, `userId`, and `price`.
3.  **User** pays with USDT via Crossmint.
4.  **Crossmint** sends a webhook `payment.succeeded` to Backend.
5.  **Backend** validates webhook signature.
6.  **Backend** extracts `userId`, `packageId`, and `paymentId`.
7.  **Backend** calls `db.GetPackageByID(packageId)` to verify amounts.
8.  **Backend** calls `db.AddCredits(userId, credits, "purchase", description, paymentId)`.

## 3. Security Audit

### 3.1 Webhook Verification (CRITICAL)
*   **Risk:** Attackers sending fake "payment succeeded" webhooks to credit accounts for free.
*   **Requirement:** The backend **MUST** verify the Crossmint webhook signature (HMAC-SHA256) using the secret key stored in environment variables.
*   **Code Reference:** A new middleware or handler validation step is needed in `api/`.

### 3.2 Idempotency
*   **Risk:** Crossmint sending the same webhook multiple times (retry logic), leading to double-crediting.
*   **Mitigation:** `credit_transactions.reference_id` (used for `paymentId`) should be unique.
*   **Existing Protection:** `config/CREDITS_SYSTEM.md` mentions `reference_id`, but does not explicitly state a unique constraint in the `CREATE TABLE` SQL provided in the docs.
    *   *Action Item:* Verify if `reference_id` has a UNIQUE constraint or implement a check (`SELECT count(*) FROM credit_transactions WHERE reference_id = ?`) before processing.

### 3.3 Price Tampering
*   **Risk:** User modifying the client-side code to pay 1 USDT for a 100 USDT package.
*   **Mitigation:** Do not trust the amount in the webhook blindly. Use the `packageId` passed in the webhook metadata to look up the *canonical* price and credit amount from the database (`credit_packages` table) before awarding credits.

## 4. Implementation Recommendations

### 4.1 Configuration
Add the following to `.env` (and `.env.example`):
```bash
CROSSMINT_PROJECT_ID=...
CROSSMINT_CLIENT_SECRET=...
CROSSMINT_WEBHOOK_SECRET=...
```

### 4.2 Backend Handler (Go)
Create `api/handlers/payment_webhook.go`.
Logic:
```go
func HandleCrossmintWebhook(c *gin.Context) {
    // 1. Verify Signature
    // 2. Parse JSON body
    // 3. Check Event Type == "payment.succeeded" (or equivalent)
    // 4. Extract metadata (userID, packageID)
    // 5. Check Idempotency (Check if paymentID exists in credit_transactions)
    // 6. Look up Package: pkg, _ := db.GetPackageByID(packageID)
    // 7. db.AddCredits(userID, pkg.Credits + pkg.BonusCredits, "purchase", "Crossmint USDT", paymentID)
}
```

### 4.3 Frontend Integration
Use the official `@crossmint/client-sdk-react-ui`.
Ensure the `passThrough` or `metadata` field in the Crossmint payload includes the internal `userId` and `packageId` so the webhook knows who to credit.

## 5. Missing Elements & Risks

*   **Test Environment:** Need to set up a Crossmint Staging environment to test without real USDT.
*   **Refund Handling:** The current `CREDITS_SYSTEM.md` mentions a `refund` category but no automated logic. Crossmint refunds would need a manual or automated process to call `DeductCredits`.
*   **USDT Chain Support:** Clarify which chains (Polygon, ETH, etc.) are supported for USDT payments to ensure low gas fees for users.

## 6. Conclusion
The proposed module is a standard and low-risk addition, provided strict webhook verification and "source of truth" (database package prices) logic is followed. It fits seamlessly into the existing Credits System.
