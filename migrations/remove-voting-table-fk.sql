-- Remove foreign key constraint from voters table if it exists
ALTER TABLE voters DROP CONSTRAINT IF EXISTS "FK_voters_votingTableId" CASCADE;

-- Ensure votingTableId is just a simple integer column (no foreign key)
-- The column should already exist, but make sure it's nullable and simple
-- No additional changes needed if the column is already there as a simple integer
