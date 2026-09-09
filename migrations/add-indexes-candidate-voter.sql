-- Add indexes to candidate_voter table for performance optimization
-- These indexes improve query performance for finding voters by candidate or leader

-- Index on voter_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_candidate_voter_voter_id 
ON candidate_voter(voter_id);

-- Index on candidate_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_candidate_voter_candidate_id 
ON candidate_voter(candidate_id);

-- Index on leader_id for faster lookups and nullable queries
CREATE INDEX IF NOT EXISTS idx_candidate_voter_leader_id 
ON candidate_voter(leader_id);

-- Composite index for candidate + leader filtering (optional, useful for complex queries)
CREATE INDEX IF NOT EXISTS idx_candidate_voter_candidate_leader 
ON candidate_voter(candidate_id, leader_id);
