-- Asegurar que la tabla user_permissions existe y tiene estructura correcta
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id SERIAL PRIMARY KEY,
    "userId" integer NOT NULL,
    "permissionId" integer NOT NULL,
    granted boolean NOT NULL DEFAULT true,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_permissions_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_permissions_permission FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_permissions UNIQUE ("userId", "permissionId")
);

-- Crear índices para mejor rendimiento si no existen
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions("userId");
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON public.user_permissions("permissionId");

