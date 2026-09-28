-- Master table for political status values
CREATE TABLE IF NOT EXISTS political_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO political_statuses (name)
VALUES
    ('Activo'),
    ('Pendiente'),
    ('Inactivo')
ON CONFLICT (name) DO NOTHING;

-- Numeric field in voters for master-table relation
ALTER TABLE voters
ADD COLUMN IF NOT EXISTS "politicalStatusId" INTEGER;

ALTER TABLE voters
ADD CONSTRAINT fk_voters_political_status
FOREIGN KEY ("politicalStatusId")
REFERENCES political_statuses(id)
ON DELETE SET NULL;

-- Keep history aligned with main voter fields
ALTER TABLE voters_history
ADD COLUMN IF NOT EXISTS "politicalStatusId" INTEGER;
