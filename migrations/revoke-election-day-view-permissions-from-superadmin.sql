-- Superadmin solo crea Director/Testigo; no opera Mi mesa ni Tablero.
-- Quita permisos de vistas Día D del rol 1 (ya asignados en migración previa).
DELETE FROM role_permissions
WHERE "roleId" = 1
  AND "permissionId" IN (
    SELECT id FROM permissions
    WHERE name IN (
      'voting:access',
      'control-board:read',
      'my-table:read',
      'my-table:report',
      'novelties:read',
      'novelties:create'
    )
  );
-- Verificación: Superadmin (1) no debe aparecer
SELECT r.id AS role_id, r.name AS role_name, p.name AS permission_name
FROM roles r
JOIN role_permissions rp ON rp."roleId" = r.id
JOIN permissions p ON p.id = rp."permissionId"
WHERE p.name IN (
  'voting:access',
  'control-board:read',
  'my-table:read',
  'my-table:report',
  'novelties:read',
  'novelties:create'
)
ORDER BY r.id, p.name;
