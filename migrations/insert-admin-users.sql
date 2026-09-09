-- Insert Superadmin and Campaign Admin users
INSERT INTO users (email, password, "roleId", "createdAt", "updatedAt") VALUES
('admin@smartpol', '$2b$10$OIKmKwOimV2SAsae6rjY8emVtZRC4k/73LS1oiOeo/hxvOMvqm1S.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('admincamp@smartpol', '$2b$10$OIKmKwOimV2SAsae6rjY8emVtZRC4k/73LS1oiOeo/hxvOMvqm1S.', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
