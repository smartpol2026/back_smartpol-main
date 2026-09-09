-- Reset and reassign all role permissions for digitador (Role ID: 5)
-- This migration ensures digitador has READ permissions for:
-- departments, municipalities, voting-booths, voting-tables, leaders, candidates
-- And full CRUD permissions for voters

-- First, remove all existing permissions for digitador
DELETE FROM role_permissions WHERE "roleId" = 5;

-- Reassign permissions for DIGITADOR (Role ID: 5)
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 5, id FROM permissions 
WHERE name IN (
  -- Voters: Full CRUD
  'voters:create', 'voters:read', 'voters:update', 'voters:delete',
  -- Read-only on reference data
  'departments:read', 
  'municipalities:read', 
  'corporations:read',
  'voting-booths:read', 
  'voting-tables:read',
  -- New: Read leaders and candidates
  'leaders:read', 
  'candidates:read'
)
ON CONFLICT DO NOTHING;
