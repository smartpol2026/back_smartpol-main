-- Metadatos de evidencia (foto/video) en reportes de mesa.
-- El archivo se guarda en disco (uploads/election-day); la BD guarda ruta y metadata.
ALTER TABLE table_reports
  ADD COLUMN IF NOT EXISTS "evidencePath" TEXT,
  ADD COLUMN IF NOT EXISTS "evidenceOriginalName" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "evidenceMimeType" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "evidenceSizeBytes" BIGINT;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'table_reports'
  AND column_name LIKE 'evidence%'
ORDER BY column_name;
