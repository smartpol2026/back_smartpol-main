-- Add userId column to candidates table
ALTER TABLE candidates
ADD COLUMN "userId" INTEGER UNIQUE;

-- Add foreign key constraint
ALTER TABLE candidates
ADD CONSTRAINT fk_candidates_userId
FOREIGN KEY ("userId") REFERENCES users(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Create index for better performance
CREATE INDEX idx_candidates_userId ON candidates("userId");

-- Associate each candidate with their user
UPDATE candidates SET "userId" = 6 WHERE id = 1;  -- NELLO ZABARAIN
UPDATE candidates SET "userId" = 7 WHERE id = 2;  -- JOSE MACEA
UPDATE candidates SET "userId" = 8 WHERE id = 3;  -- ALVARO MONEDERO
UPDATE candidates SET "userId" = 9 WHERE id = 4;  -- VIVIANA BLELL
UPDATE candidates SET "userId" = 10 WHERE id = 5; -- MARIA PAZ GAVIRIA
UPDATE candidates SET "userId" = 11 WHERE id = 6; -- LUIS RAMIRO RICARDO
UPDATE candidates SET "userId" = 12 WHERE id = 7; -- ALEJANDRO DE LA OSSA
