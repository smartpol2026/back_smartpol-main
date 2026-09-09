-- Crear nuevo rol "Especial" con ID 6
INSERT INTO roles (id, name, description) VALUES 
(6, 'Especial', 'Usuario especial con permisos personalizados');

-- Asignar permisos básicos al rol Especial (puede ser vacío o con permisos mínimos)
-- Por ahora lo dejo sin permisos, se pueden asignar según sea necesario
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 6, id FROM permissions 
WHERE name IN ('voters:read', 'departments:read', 'municipalities:read', 'corporations:read');

-- Verificar inserción
SELECT * FROM roles WHERE id = 6;
