DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM roles
        WHERE id = 7 AND name <> 'Director de campaña'
    ) OR EXISTS (
        SELECT 1 FROM roles
        WHERE name = 'Director de campaña' AND id <> 7
    ) THEN
        RAISE EXCEPTION 'El ID 7 o el nombre Director de campaña ya está en uso';
    END IF;

    IF EXISTS (
        SELECT 1 FROM roles
        WHERE id = 8 AND name <> 'Testigo electoral'
    ) OR EXISTS (
        SELECT 1 FROM roles
        WHERE name = 'Testigo electoral' AND id <> 8
    ) THEN
        RAISE EXCEPTION 'El ID 8 o el nombre Testigo electoral ya está en uso';
    END IF;
END
$$;

INSERT INTO roles (id, name, description)
VALUES
    (
        7,
        'Director de campaña',
        'Responsable del seguimiento general de la jornada electoral'
    ),
    (
        8,
        'Testigo electoral',
        'Responsable del seguimiento y reporte de una mesa electoral'
    )
ON CONFLICT (id) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    "updatedAt" = CURRENT_TIMESTAMP;

-- Asegurar que el siguiente rol use un ID superior a los existentes.
SELECT setval(
    pg_get_serial_sequence('roles', 'id'),
    (SELECT MAX(id) FROM roles),
    true
);
-- Verificación
SELECT id, name, description
FROM roles
WHERE name IN ('Director de campaña', 'Testigo electoral')
ORDER BY id;
