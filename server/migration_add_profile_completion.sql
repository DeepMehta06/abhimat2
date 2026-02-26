-- Migration: Add profile completion fields to existing members table
-- Run this in Supabase SQL Editor if you already have the members table

-- Add new columns to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS team_leader text,
ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;

-- Make name nullable (for incomplete profiles)
ALTER TABLE members 
ALTER COLUMN name DROP NOT NULL;

-- Update existing members to have profile_completed = true
-- (since they already have names filled in)
UPDATE members 
SET profile_completed = true 
WHERE name IS NOT NULL;

-- Verify changes
SELECT 
  member_id, 
  name, 
  party, 
  team_leader,
  profile_completed,
  alignment,
  role
FROM members
ORDER BY alignment, party;
