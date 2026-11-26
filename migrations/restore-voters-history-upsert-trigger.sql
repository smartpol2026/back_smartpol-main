-- Source of truth for the voters -> voters_history sync.
--
-- Why this file exists:
--   add-created-by-user-to-voters-history.sql (applied in production on 2026-11-26)
--   replaced public.log_new_voter_to_history() with an INSERT-only version. Once
--   voters_history has the UNIQUE index on identification, that version fails on
--   any duplicate identification and does not sync UPDATEs. This migration puts
--   back the UPSERT version and its triggers.
--
-- Safe to re-run: every step is idempotent. It is new, so migration:run executes
-- it on databases that already applied the older migrations.

-- 1. Columns used by the trigger function (already exist, guarded for safety)
ALTER TABLE public.voters_history ADD COLUMN IF NOT EXISTS "createdByUserId" integer;
ALTER TABLE public.voters_history ADD COLUMN IF NOT EXISTS "politicalStatusId" integer;

-- 2. Remove duplicate identifications (keeps the most recent row). No-op when clean.
DELETE FROM public.voters_history vh
USING public.voters_history vh2
WHERE vh.identification = vh2.identification
  AND (vh."recordedAt", vh.id) < (vh2."recordedAt", vh2.id);

-- 3. Unique index on identification (replaces the old non-unique one)
DROP INDEX IF EXISTS public.idx_voters_history_identification;
CREATE UNIQUE INDEX IF NOT EXISTS ux_voters_history_identification
    ON public.voters_history(identification);

-- 4. Trigger function with UPSERT
CREATE OR REPLACE FUNCTION public.log_new_voter_to_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.voters_history (
        "firstName",
        "lastName",
        identification,
        gender,
        "bloodType",
        "birthDate",
        phone,
        neighborhood,
        email,
        occupation,
        "politicalStatus",
        "politicalStatusId",
        address,
        "departmentId",
        "municipalityId",
        "votingBoothId",
        "votingTableId",
        "createdAt",
        "createdByUserId",
        "recordedAt"
    ) VALUES (
        NEW."firstName",
        NEW."lastName",
        NEW.identification,
        NEW.gender,
        NEW."bloodType",
        NEW."birthDate",
        NEW.phone,
        NEW.neighborhood,
        NEW.email,
        NEW.occupation,
        NEW."politicalStatus",
        NEW."politicalStatusId",
        NEW.address,
        NEW."departmentId",
        NEW."municipalityId",
        NEW."votingBoothId",
        NEW."votingTableId",
        NEW."createdAt",
        NEW."createdByUserId",
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (identification) DO UPDATE SET
        "firstName" = EXCLUDED."firstName",
        "lastName" = EXCLUDED."lastName",
        gender = EXCLUDED.gender,
        "bloodType" = EXCLUDED."bloodType",
        "birthDate" = EXCLUDED."birthDate",
        phone = EXCLUDED.phone,
        neighborhood = EXCLUDED.neighborhood,
        email = EXCLUDED.email,
        occupation = EXCLUDED.occupation,
        "politicalStatus" = EXCLUDED."politicalStatus",
        "politicalStatusId" = EXCLUDED."politicalStatusId",
        address = EXCLUDED.address,
        "departmentId" = EXCLUDED."departmentId",
        "municipalityId" = EXCLUDED."municipalityId",
        "votingBoothId" = EXCLUDED."votingBoothId",
        "votingTableId" = EXCLUDED."votingTableId",
        "createdByUserId" = EXCLUDED."createdByUserId",
        "recordedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Triggers: INSERT and UPDATE on voters
DROP TRIGGER IF EXISTS trigger_log_new_voter ON public.voters;
CREATE TRIGGER trigger_log_new_voter
AFTER INSERT ON public.voters
FOR EACH ROW
EXECUTE FUNCTION public.log_new_voter_to_history();

DROP TRIGGER IF EXISTS trigger_sync_voter_update ON public.voters;
CREATE TRIGGER trigger_sync_voter_update
AFTER UPDATE ON public.voters
FOR EACH ROW
EXECUTE FUNCTION public.log_new_voter_to_history();
