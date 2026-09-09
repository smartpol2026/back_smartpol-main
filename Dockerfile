# ===== BUILD =====
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ===== RUN =====
FROM node:20-alpine
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/src/main.js"]

