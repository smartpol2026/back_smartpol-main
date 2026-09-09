-- Asignar roles a los usuarios admin
UPDATE users SET "roleId" = 1 WHERE id = 47 AND email = 'admin@smartpol';      -- Superadmin
UPDATE users SET "roleId" = 2 WHERE id = 48 AND email = 'admincamp@smartpol';  -- Admin de campaña
