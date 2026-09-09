import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

function parseOrigins(env?: string) {
  if (!env) return null;
  return env
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const origins = parseOrigins(process.env.CORS_ORIGIN);  
  app.enableCors({
    origin: origins?.length
      ? origins
      : [
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:3000',
          'http://127.0.0.1:3000',
        ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: false, // ✅ JWT Bearer => sin cookies
  });


  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('SmartPol API')
    .setDescription('RESTful API for managing political campaigns, candidates, leaders and voters')
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token'
    )
    .addTag('System', 'API status and health')
    .addTag('Authentication', 'Authentication, registration and JWT session management')
    .addTag('Corporations', 'Management of corporations and political groups')
    .addTag('Users', 'System user management')
    .addTag('Leaders', 'Management of political leaders and referents')
    .addTag('Candidates', 'Management of candidates and electoral campaigns')
    .addTag('Voters', 'Management of voters and electoral registry')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); 

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`✓ Application running on: http://localhost:${port}`);
  console.log(`✓ Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
