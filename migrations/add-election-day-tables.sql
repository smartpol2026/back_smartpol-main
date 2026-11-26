-- Modelo base de operación Día D con aislamiento por campaña.
-- Director y Testigo solo consultan datos de su campaña asignada en campaign_users.
CREATE TABLE IF NOT EXISTS witness_table_assignments (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "campaignId" INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    "votingBoothId" INTEGER NOT NULL REFERENCES voting_booths(id) ON DELETE CASCADE,
    "tableNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_witness_user_campaign UNIQUE ("userId", "campaignId"),
    CONSTRAINT uq_witness_mesa_campaign UNIQUE ("campaignId", "votingBoothId", "tableNumber")
);

CREATE INDEX IF NOT EXISTS idx_witness_assignments_user ON witness_table_assignments("userId");
CREATE INDEX IF NOT EXISTS idx_witness_assignments_campaign ON witness_table_assignments("campaignId");
CREATE INDEX IF NOT EXISTS idx_witness_assignments_booth ON witness_table_assignments("votingBoothId");

CREATE TABLE IF NOT EXISTS table_reports (
    id SERIAL PRIMARY KEY,
    "campaignId" INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    "votingBoothId" INTEGER NOT NULL REFERENCES voting_booths(id) ON DELETE CASCADE,
    "tableNumber" INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    "estimatedParticipation" NUMERIC(5, 2),
    observations TEXT,
    "evidenceUrl" TEXT,
    "createdByUserId" INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_table_reports_campaign ON table_reports("campaignId");
CREATE INDEX IF NOT EXISTS idx_table_reports_booth_table ON table_reports("votingBoothId", "tableNumber");
CREATE INDEX IF NOT EXISTS idx_table_reports_created_at ON table_reports("createdAt");

CREATE TABLE IF NOT EXISTS table_novelties (
    id SERIAL PRIMARY KEY,
    "campaignId" INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    "votingBoothId" INTEGER NOT NULL REFERENCES voting_booths(id) ON DELETE CASCADE,
    "tableNumber" INTEGER NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    "createdByUserId" INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_table_novelties_campaign ON table_novelties("campaignId");
CREATE INDEX IF NOT EXISTS idx_table_novelties_booth_table ON table_novelties("votingBoothId", "tableNumber");
CREATE INDEX IF NOT EXISTS idx_table_novelties_severity ON table_novelties(severity);
CREATE INDEX IF NOT EXISTS idx_table_novelties_created_at ON table_novelties("createdAt");
