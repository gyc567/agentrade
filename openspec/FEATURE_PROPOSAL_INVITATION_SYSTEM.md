# Feature Proposal: User Invitation System

## 1. Context & Objectives
To drive user growth, we need an invitation system where existing users can invite new users.
- **Single-layer Reward**: User A invites User B -> User A gets a reward. (User B invites C -> B gets reward, A gets nothing).
- **Tracking Structure**: We will track the full lineage (A->B->C) in the database for potential future features, even if rewards are currently single-level.
- **Reward**: 10 Credits for the inviter upon successful registration of the invitee.
- **Principles**: KISS (Keep It Simple, Stupid), High Cohesion, Low Coupling, **Transactional Integrity**.

## 2. Technical Architecture

### 2.1 Database Schema Changes
We will modify the existing `users` table rather than creating a complex new relation, as the relationship is 1:N (User:Invitees).

**Table: `users`**
Add the following columns:
- `invite_code` (TEXT, UNIQUE, INDEX): The user's personal invitation code (8 characters).
- `invited_by_user_id` (TEXT, FK references users.id, NULLABLE): Who invited this user.
- `invitation_level` (INTEGER, DEFAULT 0): The depth in the invitation tree (Root=0, Invitee=1, etc.).

**Note**: We will NOT use a separate `invitation_codes` table as codes are permanent and tied to users 1:1.

### 2.2 Invitation Code Generation Rules
- **Format**: Alphanumeric [a-z, A-Z, 0-9].
- **Length**: 8 characters (sufficient entropy).
- **Uniqueness**: Guaranteed by database `UNIQUE` constraint.
- **Collision Handling**: Implementation must include a retry loop (max 3 retries) if a generated code collides.
- **Trigger**:
  - *New Users*: Generated automatically during registration.
  - *Existing Users*: **Eager Migration**. A database migration script will generate and backfill codes for all existing users immediately.

### 2.3 Reward Logic (Transactional)
- **Atomicity**: The User Creation and the Credit Reward MUST occur within the **SAME Database Transaction**. If one fails, both roll back.
- **Trigger**: Successful registration of a new user who provided a valid `invite_code`.
- **Action**: Award 10 credits to the user identified by `invited_by_user_id`.
- **Interface**: Use an interface `InvitationRewarder` to decouple `Auth` from `Credits`.
- **Category**: `referral_reward`.

## 3. Implementation Plan

### Phase 1: Database Migration
1. Create a migration script `database/migrations/xxxx_add_invitation_columns.sql`.
2. Add columns: `invite_code`, `invited_by_user_id`, `invitation_level`.
3. **Data Backfill**: The script must generate unique codes for all existing users and populate the `invite_code` column.
4. Create Index on `invite_code`.

### Phase 2: Backend Logic (`auth` & `service`)
1. **Utility**: Create `GenerateInviteCode()` in a util package.
2. **Interface**: Define `InvitationRewarder` in `auth` package (implemented by `credits` service).
3. **Registration Flow (`auth/register`)**:
   - Accept optional `inviteCode` in request body.
   - **Start Transaction**.
   - If `inviteCode` is provided:
     - Validate code exists (SELECT user_id, level FROM users WHERE invite_code = ? FOR UPDATE/SHARE).
     - **Anti-Fraud**: Ensure User isn't inviting themselves (not possible for new reg, but good practice).
     - Set `invited_by_user_id` = Inviter's ID.
     - Set `invitation_level` = Inviter's Level + 1.
   - **Insert User**:
     - Generate `invite_code` loop (retry on duplicate error).
     - Perform INSERT.
   - **Reward**:
     - If `invited_by_user_id` is present:
       - Call `InvitationRewarder.Reward(tx, inviterID, 10, newUserID)`.
   - **Commit Transaction**.

### Phase 3: Public API
- `POST /auth/register`: Update DTO to include `inviteCode`.
- `GET /user/profile`: Ensure `invite_code` is returned in the response.

## 4. Verification & Testing

### 4.1 Unit Tests
- Test `GenerateInviteCode` for length and charset.
- Test uniqueness collision handling (mock the generator to force collision).

### 4.2 Integration Tests
- **Scenario A (Normal Register)**: User registers without code -> Success, Level 0, Own code generated.
- **Scenario B (Invited Register)**:
  - User A exists.
  - User B registers with A's code.
  - Check B's DB record: `invited_by` == A.id, `level` == A.level + 1.
  - Check A's Credits: Increased by 10 (Verify Transaction Log).
- **Scenario C (Invalid Code)**: Register with non-existent code -> Error.
- **Scenario D (Transaction Rollback)**: Mock Credit failure -> User creation should also fail (rollback).

## 5. Security & Limits
- Rate limiting on Registration endpoint prevents brute-forcing invite codes.
- `invite_code` index ensures fast lookups.
- **Strict Transactional Boundaries** ensure no "free" users or "lost" credits.

