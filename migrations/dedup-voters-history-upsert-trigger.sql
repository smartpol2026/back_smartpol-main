-- =====================================================================
-- Migration: dedup-voters-history-upsert-trigger
-- Objetivo:
--   1. Eliminar registros duplicados en voters_history (una fila por identificacion)
--   2. Garantizar a nivel BD que nunca se generen duplicados:

-- 0. Respaldo de seguridad
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS voters_history_backup;
CREATE TABLE voters_history_backup AS SELECT * FROM voters_history;

-- ---------------------------------------------------------------------
-- 1. Limpieza de duplicado
-- ---------------------------------------------------------------------
DELETE FROM voters_history vh
USING voters_history vh2
WHERE vh.identification = vh2.identification
  AND (vh."recordedAt", vh.id) < (vh2."recordedAt", vh2.id);

-- ---------------------------------------------------------------------
-- 2. Indice UNIQUE sobre identification
--     Reemplaza el indice normal anterior (idx_voters_history_identification)
-- ---------------------------------------------------------------------
DROP INDEX IF EXISTS idx_voters_history_identification;
CREATE UNIQUE INDEX ux_voters_history_identification
    ON public.voters_history(identification);

-- ---------------------------------------------------------------------
-- 3. Funcion trigger con UPSERT

-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 4. Trigger AFTER INSERT 
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_log_new_voter ON public.voters;
CREATE TRIGGER trigger_log_new_voter
AFTER INSERT ON public.voters
FOR EACH ROW
EXECUTE FUNCTION public.log_new_voter_to_history();

-- ---------------------------------------------------------------------
-- 5. Trigger AFTER UPDATE (nuevo)

-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_sync_voter_update ON public.voters;
CREATE TRIGGER trigger_sync_voter_update
AFTER UPDATE ON public.voters
FOR EACH ROW
EXECUTE FUNCTION public.log_new_voter_to_history();


