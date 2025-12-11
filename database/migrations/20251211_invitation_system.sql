-- Migration: Add Invitation System Support
-- Date: 2025-12-11

-- 1. Add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by_user_id TEXT REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_level INTEGER DEFAULT 0;

-- 2. Backfill existing users with unique invite codes
-- Using MD5 of random+id ensures high entropy and effectively zero collision for small datasets during migration
UPDATE users 
SET invite_code = substring(md5(random()::text || id || clock_timestamp()::text) from 1 for 8)
WHERE invite_code IS NULL;

-- 3. Add constraints and indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by_user_id);

-- 4. Enforce Not Null on invite_code (after backfill)
ALTER TABLE users ALTER COLUMN invite_code SET NOT NULL;
