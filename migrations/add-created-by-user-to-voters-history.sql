-- Add createdByUserId column to voters_history table
ALTER TABLE public.voters_history
ADD COLUMN IF NOT EXISTS "createdByUserId" integer;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_voters_history_created_by_user_id
ON public.voters_history("createdByUserId");

-- NOTE: the trigger function public.log_new_voter_to_history() and its triggers
-- (already include "createdByUserId") are owned by
-- dedup-voters-history-upsert-trigger.sql. They are intentionally NOT redefined
-- here: an older insert-only version would break voter updates / duplicates
-- once the unique index on voters_history.identification exists.
