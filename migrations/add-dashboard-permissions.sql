-- Insert dashboard permission
INSERT INTO permissions (name, resource, action, description) VALUES
('dashboard:read', 'dashboard', 'read', 'Ver el dashboard principal')
ON CONFLICT DO NOTHING;


-- SUPERADMIN (Role ID: 1)
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 1, id FROM permissions WHERE name = 'dashboard:read'
ON CONFLICT DO NOTHING;

-- ADMIN DE CAMPAÑA (Role ID: 2)
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 2, id FROM permissions WHERE name = 'dashboard:read'
ON CONFLICT DO NOTHING;

-- CANDIDATO (Role ID: 3)
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 3, id FROM permissions WHERE name = 'dashboard:read'
ON CONFLICT DO NOTHING;

-- LÍDER (Role ID: 4)
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 4, id FROM permissions WHERE name = 'dashboard:read'
ON CONFLICT DO NOTHING;



