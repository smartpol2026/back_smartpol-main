<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Despliegue en Servidor

### Requisitos Previos

- **Node.js** v18+ y **pnpm**
- **PostgreSQL** 12+
- **Git**
- Acceso SSH al servidor
- **PM2** o **Docker** (opcional pero recomendado)

### Opción 1: Despliegue Manual con PM2

#### 1. Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar PM2 globalmente
sudo npm install -g pm2
```

#### 2. Clonar y Configurar la Aplicación

```bash
# Clonar repositorio
git clone <tu-repo-url> /home/usuario/smartpol-api
cd /home/usuario/smartpol-api

# Instalar dependencias
pnpm install

# Crear archivo .env.production
cp .env .env.production
```

#### 3. Configurar Variables de Entorno

Editar `.env.production`:

```env
NODE_ENV=production
PORT=3000
API_PREFIX=api

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=smartpol_user
DB_PASSWORD=tu_contraseña_segura
DB_NAME=smartpol_db
DB_SYNCHRONIZE=false

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
JWT_EXPIRATION=24h

# API Documentation
SWAGGER_PATH=api/docs

# CORS
CORS_ORIGIN=http://localhost:3000,https://tu-dominio.com
```

#### 4. Compilar Aplicación

```bash
pnpm run build
```

#### 5. Configurar Base de Datos

```bash
# Conectarse a PostgreSQL
sudo -u postgres psql

# En la consola de PostgreSQL:
CREATE USER smartpol_user WITH PASSWORD 'tu_contraseña_segura';
CREATE DATABASE smartpol_db OWNER smartpol_user;
GRANT ALL PRIVILEGES ON DATABASE smartpol_db TO smartpol_user;
\q
```

#### 6. Ejecutar Migraciones (si existen)

```bash
pnpm run migration:run
```

#### 7. Iniciar con PM2

```bash
# Iniciar aplicación
pm2 start dist/main.js --name "smartpol-api"

# Guardar configuración
pm2 save

# Ejecutar al reiniciar
sudo pm2 startup

# Verificar estado
pm2 status
pm2 logs smartpol-api
```

### Opción 2: Despliegue con Docker (Recomendado)

#### 1. Crear Dockerfile

```dockerfile
# filepath: Dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Compilar
RUN pnpm run build

# Exponer puerto
EXPOSE 3000

# Iniciar aplicación
CMD ["node", "dist/main.js"]
```

#### 2. Crear docker-compose.yml

```yaml
# filepath: docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: smartpol-db
    environment:
      POSTGRES_USER: smartpol_user
      POSTGRES_PASSWORD: tu_contraseña_segura
      POSTGRES_DB: smartpol_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U smartpol_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: .
    container_name: smartpol-api
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: smartpol_user
      DB_PASSWORD: tu_contraseña_segura
      DB_NAME: smartpol_db
      JWT_SECRET: tu_jwt_secret_muy_seguro_aqui
      JWT_EXPIRATION: 24h
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

volumes:
  postgres_data:
```

#### 3. Desplegar con Docker

```bash
# Construir y levantar contenedores
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Detener
docker-compose down
```

### Opción 3: Despliegue en Vercel/Netlify (Para serverless)

#### 1. Crear vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/main.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/main.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "DB_HOST": "@db_host",
    "DB_PORT": "@db_port",
    "DB_USERNAME": "@db_username",
    "DB_PASSWORD": "@db_password",
    "DB_NAME": "@db_name",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

#### 2. Desplegar

```bash
npm i -g vercel
vercel
```

---

## 🔒 Configuración de Seguridad

### 1. Nginx como Proxy Reverso

```nginx
# /etc/nginx/sites-available/smartpol-api
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;
    
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Certificado SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d tu-dominio.com
```

### 3. Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 📊 Monitoreo y Mantenimiento

### Con PM2

```bash
# Panel de monitoreo
pm2 monit

# Ver detalles
pm2 show smartpol-api

# Reiniciar
pm2 restart smartpol-api

# Logs
pm2 logs smartpol-api --lines 100
```

### Backups de BD

```bash
# Backup automático diario
0 2 * * * pg_dump -U smartpol_user smartpol_db > /backups/smartpol_$(date +\%Y\%m\%d).sql
```

---

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).