-- Add userId column to leaders table
ALTER TABLE leaders
ADD COLUMN "userId" INTEGER UNIQUE;

-- Add foreign key constraint
ALTER TABLE leaders
ADD CONSTRAINT fk_leaders_userId
FOREIGN KEY ("userId") REFERENCES users(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Create index for better performance
CREATE INDEX idx_leaders_userId ON leaders("userId");

-- Associate each leader with their user (users created start from ID 13)
UPDATE leaders SET "userId" = 13 WHERE id = 1;   -- HELMAR MENDOZA
UPDATE leaders SET "userId" = 14 WHERE id = 2;   -- RAMIRO TAPIA
UPDATE leaders SET "userId" = 15 WHERE id = 3;   -- FERNEY BENITEZ
UPDATE leaders SET "userId" = 16 WHERE id = 4;   -- JONATAN BETIN
UPDATE leaders SET "userId" = 17 WHERE id = 5;   -- ELSON ARANATES ACOSTA RIVERO
UPDATE leaders SET "userId" = 18 WHERE id = 6;   -- BERTONIS DE LA ROSA
UPDATE leaders SET "userId" = 19 WHERE id = 7;   -- JOSE RAMIRO PULGAR ALVAREZ
UPDATE leaders SET "userId" = 20 WHERE id = 8;   -- GILBERTO CARLOS MANJARRES MEZA
UPDATE leaders SET "userId" = 21 WHERE id = 9;   -- ISMAEL CARLOS SIERRA TORRES
UPDATE leaders SET "userId" = 22 WHERE id = 10;  -- NESTOR ENRIQUE GARCIA ARRIETA
UPDATE leaders SET "userId" = 23 WHERE id = 11;  -- ALVARO ENRIQUE VITOLA TERAN
UPDATE leaders SET "userId" = 24 WHERE id = 12;  -- PABLO ANTONIO CENTENO CORTEZ
UPDATE leaders SET "userId" = 25 WHERE id = 13;  -- ANIBAL JOSE GONZALEZ GARRIDO
UPDATE leaders SET "userId" = 26 WHERE id = 14;  -- ALEX ANGULO RIVERO
UPDATE leaders SET "userId" = 27 WHERE id = 15;  -- JOAQUIN ANTONIO GONZALEZ CONTRERAS
UPDATE leaders SET "userId" = 28 WHERE id = 16;  -- BETSABE SEGUNDO BLANCO BENITEZ
UPDATE leaders SET "userId" = 29 WHERE id = 17;  -- OSCAR ANIBAL NARVAEZ OVIEDO
UPDATE leaders SET "userId" = 30 WHERE id = 18;  -- HARLINTON GARCIA BARRETO
UPDATE leaders SET "userId" = 31 WHERE id = 19;  -- CARLOS ROBERTO ARAQUE GAMBOA
UPDATE leaders SET "userId" = 32 WHERE id = 20;  -- JORGE LUIS HERRERA MENDOZA
UPDATE leaders SET "userId" = 33 WHERE id = 21;  -- JOSE NOVOA TRUJILLO
UPDATE leaders SET "userId" = 34 WHERE id = 22;  -- FREDY ANTONIO JARABA CAUSADO
UPDATE leaders SET "userId" = 35 WHERE id = 23;  -- JOSE RICARDO RODRIGUEZ
UPDATE leaders SET "userId" = 36 WHERE id = 24;  -- RAFAEL FRANCISCO MEDINA OSORIO
UPDATE leaders SET "userId" = 37 WHERE id = 25;  -- SILVANO VERGARA DIAZ
UPDATE leaders SET "userId" = 38 WHERE id = 26;  -- VLADIMIR ZURITA
UPDATE leaders SET "userId" = 39 WHERE id = 27;  -- JAIRO JOSE HERNANDEZ SAENZ
UPDATE leaders SET "userId" = 40 WHERE id = 28;  -- JESUS DIAZ
UPDATE leaders SET "userId" = 41 WHERE id = 29;  -- JAIRO CARANO
UPDATE leaders SET "userId" = 42 WHERE id = 30;  -- PIEDAD PEREZ PELUFFO
UPDATE leaders SET "userId" = 43 WHERE id = 31;  -- LUIS GIL PUENTES
UPDATE leaders SET "userId" = 44 WHERE id = 32;  -- LINA MARIA PELUFFO RAMIREZ
UPDATE leaders SET "userId" = 45 WHERE id = 33;  -- JUAN MERCADO
UPDATE leaders SET "userId" = 46 WHERE id = 34;  -- HOLMAN MERINO
