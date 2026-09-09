-- Create roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(500),
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (id, name, description) VALUES
    (1, 'Superadmin', 'Administrador del sistema con acceso total'),
    (2, 'Admin de campaña', 'Administrador de campaña electoral'),
    (3, 'Candidato', 'Candidato electoral'),
    (4, 'Líder', 'Líder de votación'),
    (5, 'Digitador', 'Encargado de digitalizar datos');

-- Create sequence for roles
ALTER SEQUENCE roles_id_seq RESTART WITH 6;
