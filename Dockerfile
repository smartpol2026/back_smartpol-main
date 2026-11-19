# ===== BUILD =====
FROM node:20-alpine AS build

WORKDIR /app

# Copiar dependencias y configuración de pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar dependencias
RUN corepack enable && pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Compilar backend NestJS
RUN pnpm run build


# ===== RUN =====
FROM node:20-alpine

WORKDIR /app

# Copiar dependencias y configuración de pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar dependencias de producción
RUN corepack enable && pnpm install --prod --frozen-lockfile

# Copiar aplicación compilada
COPY --from=build /app/dist ./dist

# Copiar scripts de migraciones
COPY --from=build /app/scripts ./scripts

# Copiar migraciones SQL
COPY --from=build /app/migrations ./migrations

EXPOSE 3000

CMD ["node", "dist/src/main.js"]