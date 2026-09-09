-- Insert all permissions
-- Candidates
INSERT INTO permissions (name, resource, action, description) VALUES
('candidates:create', 'candidates', 'create', 'Crear candidatos'),
('candidates:read', 'candidates', 'read', 'Ver candidatos'),
('candidates:update', 'candidates', 'update', 'Editar candidatos'),
('candidates:delete', 'candidates', 'delete', 'Eliminar candidatos');

-- Leaders
INSERT INTO permissions (name, resource, action, description) VALUES
('leaders:create', 'leaders', 'create', 'Crear líderes'),
('leaders:read', 'leaders', 'read', 'Ver líderes'),
('leaders:update', 'leaders', 'update', 'Editar líderes'),
('leaders:delete', 'leaders', 'delete', 'Eliminar líderes');

-- Voters
INSERT INTO permissions (name, resource, action, description) VALUES
('voters:create', 'voters', 'create', 'Crear votantes'),
('voters:read', 'voters', 'read', 'Ver votantes'),
('voters:update', 'voters', 'update', 'Editar votantes'),
('voters:delete', 'voters', 'delete', 'Eliminar votantes');

-- Departments
INSERT INTO permissions (name, resource, action, description) VALUES
('departments:read', 'departments', 'read', 'Ver departamentos'),
('departments:create', 'departments', 'create', 'Crear departamentos'),
('departments:update', 'departments', 'update', 'Editar departamentos'),
('departments:delete', 'departments', 'delete', 'Eliminar departamentos');

-- Municipalities
INSERT INTO permissions (name, resource, action, description) VALUES
('municipalities:read', 'municipalities', 'read', 'Ver municipios'),
('municipalities:create', 'municipalities', 'create', 'Crear municipios'),
('municipalities:update', 'municipalities', 'update', 'Editar municipios'),
('municipalities:delete', 'municipalities', 'delete', 'Eliminar municipios');

-- Corporations
INSERT INTO permissions (name, resource, action, description) VALUES
('corporations:read', 'corporations', 'read', 'Ver corporaciones'),
('corporations:create', 'corporations', 'create', 'Crear corporaciones'),
('corporations:update', 'corporations', 'update', 'Editar corporaciones'),
('corporations:delete', 'corporations', 'delete', 'Eliminar corporaciones');

-- Voting Booths
INSERT INTO permissions (name, resource, action, description) VALUES
('voting-booths:read', 'voting-booths', 'read', 'Ver puestos de votación'),
('voting-booths:create', 'voting-booths', 'create', 'Crear puestos de votación'),
('voting-booths:update', 'voting-booths', 'update', 'Editar puestos de votación'),
('voting-booths:delete', 'voting-booths', 'delete', 'Eliminar puestos de votación');

-- Voting Tables
INSERT INTO permissions (name, resource, action, description) VALUES
('voting-tables:read', 'voting-tables', 'read', 'Ver mesas de votación'),
('voting-tables:create', 'voting-tables', 'create', 'Crear mesas de votación'),
('voting-tables:update', 'voting-tables', 'update', 'Editar mesas de votación'),
('voting-tables:delete', 'voting-tables', 'delete', 'Eliminar mesas de votación');

-- Reports
INSERT INTO permissions (name, resource, action, description) VALUES
('reports:read', 'reports', 'read', 'Ver reportes');

-- Users
INSERT INTO permissions (name, resource, action, description) VALUES
('users:read', 'users', 'read', 'Ver usuarios'),
('users:create', 'users', 'create', 'Crear usuarios'),
('users:update', 'users', 'update', 'Editar usuarios'),
('users:delete', 'users', 'delete', 'Eliminar usuarios');

-- Roles & Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
('roles:read', 'roles', 'read', 'Ver roles'),
('roles:create', 'roles', 'create', 'Crear roles'),
('roles:update', 'roles', 'update', 'Editar roles'),
('roles:delete', 'roles', 'delete', 'Eliminar roles'),
('permissions:read', 'permissions', 'read', 'Ver permisos'),
('permissions:manage', 'permissions', 'manage', 'Gestionar permisos');
