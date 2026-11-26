-- Corrige nombres de roles con "ñ" corrupta (ej. "campa??a" / "L??der").
-- No cambia IDs; solo normaliza el texto.
UPDATE roles
SET name = 'Admin de campaña',
    description = 'Administrador de campaña electoral',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE id = 2
  AND name <> 'Admin de campaña';

UPDATE roles
SET name = 'Líder',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE id = 4
  AND name <> 'Líder';
SELECT id, name FROM roles WHERE id IN (2, 4) ORDER BY id;
