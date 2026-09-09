-- Add roleId column to users table
ALTER TABLE users
ADD COLUMN "roleId" INTEGER;

-- Add foreign key constraint
ALTER TABLE users
ADD CONSTRAINT fk_users_roleId
FOREIGN KEY ("roleId") REFERENCES roles(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Create index for better performance
CREATE INDEX idx_users_roleId ON users("roleId");
