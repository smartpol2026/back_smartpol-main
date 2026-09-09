import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const cacheType = configService.get('CACHE_TYPE', 'memory');

        const cacheConfig: any = {
          ttl: parseInt(configService.get('CACHE_TTL', '300'), 10) * 1000, // convertir a ms
        };

        if (cacheType === 'redis') {
          // Para Redis, configuramos con redisUrl
          const redisHost = configService.get('REDIS_HOST', 'localhost');
          const redisPort = parseInt(
            configService.get('REDIS_PORT', '6379'),
            10,
          );
          const redisPassword = configService.get('REDIS_PASSWORD');

          try {
            cacheConfig.store = 'redis';
            cacheConfig.url = redisPassword
              ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
              : `redis://${redisHost}:${redisPort}`;
            console.log('✅ Redis cache habilitado');
          } catch (error) {
            console.warn(
              '⚠️ Redis no disponible, usando memory cache fallback',
            );
          }
        }

        return cacheConfig;
      },
    }),
  ],
})
export class CacheModule {}
