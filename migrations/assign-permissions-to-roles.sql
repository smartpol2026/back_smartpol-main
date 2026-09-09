-- SUPERADMIN (Role ID: 1) - Todo
INSERT INTO role_permissions ("roleId", "permissionId") 
SELECT 1, id FROM permissions;

-- ADMIN DE CAMPAÑA (Role ID: 2) - Candidatos CRUD, Líderes CRUD, READ derivados, Reportes
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 2, id FROM permissions 
WHERE name IN (
  'candidates:create', 'candidates:read', 'candidates:update', 'candidates:delete',
  'leaders:create', 'leaders:read', 'leaders:update', 'leaders:delete',
  'departments:read', 'municipalities:read', 'corporations:read',
  'voting-booths:read', 'voting-tables:read',
  'reports:read'
);

-- CANDIDATO (Role ID: 3) - READ votantes, derivados, reportes
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 3, id FROM permissions 
WHERE name IN (
  'voters:read',
  'departments:read', 'municipalities:read', 'corporations:read',
  'voting-booths:read', 'voting-tables:read',
  'reports:read'
);

-- LÍDER (Role ID: 4) - READ votantes, derivados, reportes
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 4, id FROM permissions 
WHERE name IN (
  'voters:read',
  'departments:read', 'municipalities:read', 'corporations:read',
  'voting-booths:read', 'voting-tables:read',
  'reports:read'
);

-- DIGITADOR (Role ID: 5) - CRUD votantes, READ derivados, líderes y candidatos
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 5, id FROM permissions 
WHERE name IN (
  'voters:create', 'voters:read', 'voters:update', 'voters:delete',
  'departments:read', 'municipalities:read', 'corporations:read',
  'voting-booths:read', 'voting-tables:read',
  'leaders:read', 'candidates:read'
);
