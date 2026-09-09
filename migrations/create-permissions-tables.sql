-- Create permissions table
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action ON permissions(action);

-- Create role_permissions table
CREATE TABLE role_permissions (
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("roleId", "permissionId"),
    FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY ("permissionId") REFERENCES permissions(id) ON DELETE CASCADE
);

-- Create user_permissions table
CREATE TABLE user_permissions (
    "userId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    granted BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("userId", "permissionId"),
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("permissionId") REFERENCES permissions(id) ON DELETE CASCADE
);

-- Create indexes for user_permissions
CREATE INDEX idx_user_permissions_userId ON user_permissions("userId");
CREATE INDEX idx_user_permissions_granted ON user_permissions(granted);
