-- Permisos y asignación para Director de campaña (7) y Testigo electoral (8).
-- No recrea tablas: solo inserta permissions y role_permissions.
INSERT INTO permissions (name, resource, action, description) VALUES
    ('voting:access', 'voting', 'access', 'Acceso a la operación de Día D'),
    ('control-board:read', 'control-board', 'read', 'Ver el tablero de control electoral'),
    ('my-table:read', 'my-table', 'read', 'Ver la mesa electoral asignada'),
    ('my-table:report', 'my-table', 'report', 'Enviar reportes de la mesa electoral'),
    ('novelties:read', 'novelties', 'read', 'Ver novedades electorales'),
    ('novelties:create', 'novelties', 'create', 'Registrar novedades electorales')
ON CONFLICT (name) DO UPDATE
SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    description = EXCLUDED.description;

-- Superadmin (1): NO recibe permisos de Mi mesa / Tablero / Día D.
-- Solo crea usuarios Director/Testigo (users:create / users:manage ya existentes).

-- Director de campaña (7)
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 7, p.id
FROM permissions p
WHERE p.name IN (
    'voting:access',
    'control-board:read',
    'novelties:read'
)
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Testigo electoral (8)
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 8, p.id
FROM permissions p
WHERE p.name IN (
    'my-table:read',
    'my-table:report',
    'novelties:read',
    'novelties:create'
)
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
-- Verificación
SELECT r.id AS role_id, r.name AS role_name, p.name AS permission_name
FROM roles r
JOIN role_permissions rp ON rp."roleId" = r.id
JOIN permissions p ON p.id = rp."permissionId"
WHERE r.id IN (7, 8)
  AND p.name IN (
    'voting:access',
    'control-board:read',
    'my-table:read',
    'my-table:report',
    'novelties:read',
    'novelties:create'
  )
ORDER BY r.id, p.name;
