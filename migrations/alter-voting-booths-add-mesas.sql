-- Add 'mesas' column to voting_booths table
-- This column stores the number of voting tables/mesas in each voting booth
ALTER TABLE voting_booths
ADD COLUMN mesas INTEGER NOT NULL DEFAULT 0;

-- If you need to set a different default value, update it here:
-- UPDATE voting_booths SET mesas = 1 WHERE mesas = 0;
