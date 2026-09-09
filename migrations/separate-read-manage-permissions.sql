-- Migración: Separar permisos de lectura (read) de gestión (manage)
-- Objetivo: Crear una estructura de permisos donde:
--   - resource:read = acceso de lectura únicamente
--   - resource:manage = gestión completa (create, update, delete) + mostrar en sidebar

-- 1. Agregar permisos de gestión (manage) para cada recurso
-- Candidates
INSERT INTO permissions (name, resource, action, description) VALUES
('candidates:manage', 'candidates', 'manage', 'Gestionar candidatos (crear, editar, eliminar)')
ON CONFLICT (name) DO NOTHING;

-- Leaders
INSERT INTO permissions (name, resource, action, description) VALUES
('leaders:manage', 'leaders', 'manage', 'Gestionar líderes (crear, editar, eliminar)')
ON CONFLICT (name) DO NOTHING;

-- Voters
INSERT INTO permissions (name, resource, action, description) VALUES
('voters:manage', 'voters', 'manage', 'Gestionar votantes (crear, editar, eliminar)')
ON CONFLICT (name) DO NOTHING;

-- Departments
INSERT INTO permissions (name, resource, action, description) VALUES
('departments:manage', 'departments', 'manage', 'Gestionar departamentos (crear, editar, eliminar)')
ON CONFLICT (name) DO NOTHING;

-- Municipalities
INSERT INTO permissions (name, resource, action, description) VALUES
('municipalities:manage', 'municipalities', 'manage', 'Gestionar municipios (crear, editar, eliminar)')
ON CONFLICT (name) DO NOTHING;

-- Corporations
INSERT INTO permissions (name, resource, action, description) VALUES
('corporations:manage', 'corporations', 'manage', 'Gestionar corporaciones (crear, editar, eliminar)')
ON CONFLICT (name) DO NOTHING;

-- Voting Booths
INSERT INTO permissions (name, resource, action, description) VALUES
('voting-booths:manage', 'voting-booths', 'manage', 'Gestionar puestos de votación (crear, editar, eliminar)')
ON CONFLICT (name) DO NOTHING;

-- Voting Tables
INSERT INTO permissions (name, resource, action, description) VALUES
('voting-tables:manage', 'voting-tables', 'manage', 'Gestionar mesas de votación (crear, editar, eliminar)')
ON CONFLICT (name) DO NOTHING;

-- Organizations
INSERT INTO permissions (name, resource, action, description) VALUES
('organizations:manage', 'organizations', 'manage', 'Gestionar organizaciones (crear, editar, eliminar)')
ON CONFLICT (name) DO NOTHING;

-- Campaigns
INSERT INTO permissions (name, resource, action, description) VALUES
('campaigns:manage', 'campaigns', 'manage', 'Gestionar campañas (crear, editar, eliminar)')
ON CONFLICT (name) DO NOTHING;

-- Users
INSERT INTO permissions (name, resource, action, description) VALUES
('users:manage', 'users', 'manage', 'Gestionar usuarios (crear, editar, eliminar)')
ON CONFLICT (name) DO NOTHING;

-- Roles
INSERT INTO permissions (name, resource, action, description) VALUES
('roles:manage', 'roles', 'manage', 'Gestionar roles (crear, editar, eliminar)')
ON CONFLICT (name) DO NOTHING;

-- Reports (solo tiene read)
-- No agregamos manage para reports

-- 2. Asignar permisos manage a SUPERADMIN (Role ID: 1) que ya tiene todos los permisos
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 1, id FROM permissions 
WHERE action = 'manage'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- 3. Mantener compatibilidad hacia atrás:
-- Los permisos create/update/delete se mantienen pero ahora 'manage' es lo principal

COMMIT;
