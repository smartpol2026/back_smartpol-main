-- Coordenadas para el mapa del tablero y acceso del Admin de campaña.
ALTER TABLE voting_booths
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE voting_booths
  DROP CONSTRAINT IF EXISTS chk_voting_booths_latitude,
  ADD CONSTRAINT chk_voting_booths_latitude
    CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90);

ALTER TABLE voting_booths
  DROP CONSTRAINT IF EXISTS chk_voting_booths_longitude,
  ADD CONSTRAINT chk_voting_booths_longitude
    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);

-- Crear el permiso aquí para no depender del orden de ejecución.
-- assign-permissions-to-campaign-director-and-electoral-witness.sql lo define igual.
INSERT INTO permissions (name, resource, action, description) VALUES
('control-board:read', 'control-board', 'read', 'Ver el tablero de control electoral')
ON CONFLICT (name) DO NOTHING;

-- Admin de campaña (2) puede consultar el tablero, limitado por organización.
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 2, id
FROM permissions
WHERE name = 'control-board:read'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'voting_booths'
  AND column_name IN ('latitude', 'longitude')
ORDER BY column_name;
