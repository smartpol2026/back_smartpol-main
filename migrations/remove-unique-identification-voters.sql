-- Remove UNIQUE constraint from identification column in voters table
ALTER TABLE voters DROP CONSTRAINT IF EXISTS "UQ_voters_identification" CASCADE;

-- Alternative constraint names to handle different naming conventions
ALTER TABLE voters DROP CONSTRAINT IF EXISTS unique_identification CASCADE;
