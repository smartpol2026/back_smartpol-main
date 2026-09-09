-- Add missing permissions for organizations and campaigns

-- Organizations
INSERT INTO permissions (name, resource, action, description) VALUES
('organizations:read', 'organizations', 'read', 'Ver organizaciones'),
('organizations:create', 'organizations', 'create', 'Crear organizaciones'),
('organizations:update', 'organizations', 'update', 'Editar organizaciones'),
('organizations:delete', 'organizations', 'delete', 'Eliminar organizaciones');

-- Campaigns
INSERT INTO permissions (name, resource, action, description) VALUES
('campaigns:read', 'campaigns', 'read', 'Ver campañas'),
('campaigns:create', 'campaigns', 'create', 'Crear campañas'),
('campaigns:update', 'campaigns', 'update', 'Editar campañas'),
('campaigns:delete', 'campaigns', 'delete', 'Eliminar campañas');

-- Update role permissions for new permissions
-- SUPERADMIN (Role ID: 1) gets all new permissions
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 1, id FROM permissions 
WHERE name LIKE 'organizations:%' OR name LIKE 'campaigns:%';

-- ADMIN DE CAMPAÑA (Role ID: 2) gets campaigns and organizations read
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 2, id FROM permissions 
WHERE name IN ('organizations:read', 'campaigns:read', 'campaigns:create', 'campaigns:update', 'campaigns:delete');
