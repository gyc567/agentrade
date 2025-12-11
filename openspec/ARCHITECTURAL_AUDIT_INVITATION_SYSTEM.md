# Architectural Audit Report: Invitation System

**Target Document:** `openspec/FEATURE_PROPOSAL_INVITATION_SYSTEM.md`
**Auditor:** Gemini Architecture Agent
**Date:** 2025-12-11
**Status:** **APPROVED WITH MODIFICATIONS**

## 1. Executive Summary
The proposed Invitation System adheres well to the KISS principle and fits the existing architecture. The choice to extend the `users` table is pragmatic for a 1:1 code mapping. However, there is a **Critical Consistency Issue** regarding the separation of user registration and reward distribution that must be addressed to ensure financial (credit) integrity.

## 2. Critical Issues (Must Fix)

### 2.1. Transactional Atomicity (Data Integrity)
- **Problem**: The proposal suggests a "Post-Registration Hook" to award credits *after* registration.
    - *Scenario*: User registers successfully (Transaction A commits). The system crashes or the credit transaction fails (Transaction B fails).
    - *Result*: The new user is created with `invited_by` set, but the inviter **never receives their 10 credits**. The state is inconsistent.
- **Recommendation**: The Credit Reward (`AddCredits`) and User Registration (`INSERT into users`) **MUST** occur within the same database transaction.
    - *Refactoring*: Inject the `Credits` repository/service logic into the `Auth` service's registration transaction, OR use a transactional outbox pattern if services are strictly separated. Given the current monolithic structure, a shared transaction context is the correct approach.

### 2.2. Invite Code Collision Handling
- **Problem**: While 62^8 is a large space, random generation *can* produce collisions. A simple `UNIQUE` constraint will cause a 500 Internal Server Error for the unlucky user if a collision occurs.
- **Recommendation**: Implement a `Retry Loop` (max 3 retries) in the code generation logic. If the `INSERT` fails due to a unique constraint violation on `invite_code`, regenerate and retry immediately.

## 3. Architectural Improvements (Should Fix)

### 3.1. Coupling & Cohesion
- **Observation**: The proposal implies calling `credits.AddCredits` directly from the Registration logic.
- **Critique**: This creates a hard dependency between `Auth` and `Credits`.
- **Recommendation**: Define an interface `InvitationRewarder` in the `Auth` domain.
    ```go
    type InvitationRewarder interface {
        RewardInviter(ctx context.Context, tx *sql.Tx, inviterID, newUserID string) error
    }
    ```
    Implement this interface using the `Credits` module. This allows `Auth` to remain unaware of "Credits" specifically, only knowing it needs to "Reward" someone.

### 3.2. Lazy Generation Strategy
- **Observation**: "Generated lazily (on first request)" for existing users.
- **Risk**: If a user asks for their code, and the system crashes after generation but before saving, or if two requests come in parallel, race conditions may occur.
- **Recommendation**: Prefer a **Migration Script** to backfill all existing users with codes immediately. This simplifies the runtime logic (every user always has a code) and removes complex lazy-loading concurrency handling.

## 4. Security & Abuse Prevention

### 4.1. Self-Referral Fraud
- **Risk**: Users creating fake accounts to farm credits.
- **Mitigation**:
    - Ensure `invited_by_user_id` cannot be the user's own ID (Self-invite).
    - *Future Proofing*: Add `ip_address` or `device_id` checks. If `new_user.ip == inviter.ip`, consider flagging or blocking the reward (soft block).

## 5. Revised Implementation Steps

1.  **Migration**: Add columns to `users`. **Run a script to populate `invite_code` for ALL existing users.**
2.  **Interface**: Define `RewardInviter` interface.
3.  **Transaction**: Modify `Register` function to accept a `RewardInviter`.
    - `Begin Tx`
    - `Insert User` (Retry on invite code collision)
    - `if invited_by: RewardInviter.Reward(...)` (Pass Tx)
    - `Commit Tx`

## 6. Conclusion
The proposal is solid but needs the transactional fix to be production-ready. With the "Same Transaction" rule and "Retry on Collision" logic, the design is approved for implementation.
