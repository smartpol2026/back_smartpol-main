-- Agregar columna hasVoted a la tabla voters si no existe
-- Esta columna se usa para rastrear si un votante ha votado en Día D

DO $$
BEGIN
  -- Verificar si la columna ya existe
  IF NOT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'voters' 
    AND column_name = 'hasVoted'
  ) THEN
    -- Agregar la columna hasVoted
    ALTER TABLE voters ADD COLUMN "hasVoted" BOOLEAN DEFAULT FALSE NOT NULL;
    
    -- Crear índice para optimizar búsquedas
    CREATE INDEX idx_voters_has_voted ON voters("hasVoted");
    
    RAISE NOTICE 'Columna hasVoted agregada exitosamente a la tabla voters';
  ELSE
    RAISE NOTICE 'La columna hasVoted ya existe en la tabla voters';
  END IF;
END $$;
