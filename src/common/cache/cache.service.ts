import { Injectable, Inject, Optional } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(
    @Optional()
    @Inject(CACHE_MANAGER)
    private cacheManager?: Cache,
  ) {}

  /**
   * Obtiene un valor del cache o ejecuta la función si no está cached
   * @param key Clave del cache
   * @param fn Función a ejecutar si no está en cache
   * @param ttl Tiempo de vida en segundos
   */
  async get<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 300,
  ): Promise<T> {
    if (!this.cacheManager) {
      // Si no hay cache manager, ejecuta la función directamente
      return fn();
    }

    try {
      // Intenta obtener del cache
      const cached = await this.cacheManager.get<T>(key);
      if (cached) {
        return cached;
      }

      // Si no está en cache, ejecuta la función
      const result = await fn();

      // Guarda en cache (en ms)
      await this.cacheManager.set(key, result, ttl * 1000);

      return result;
    } catch (error) {
      console.warn(`⚠️ Error accediendo cache [${key}]:`, error);
      // Si hay error en cache, ejecuta la función sin cachear
      return fn();
    }
  }

  /**
   * Invalida (elimina) una clave del cache
   */
  async invalidate(key: string): Promise<void> {
    if (!this.cacheManager) return;

    try {
      await this.cacheManager.del(key);
    } catch (error) {
      console.warn(`⚠️ Error invalidando cache [${key}]:`, error);
    }
  }

  /**
   * Invalida múltiples claves siguiendo un patrón
   * Útil para limpiar grupo de claves relacionadas
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    if (!this.cacheManager) return;

    try {
      const keys = await (this.cacheManager as any).store?.keys?.();
      if (keys && Array.isArray(keys)) {
        const matchingKeys = keys.filter((k: string) => k.includes(pattern));

        for (const key of matchingKeys) {
          await this.cacheManager.del(key);
        }
      }
    } catch (error) {
      console.warn(
        `⚠️ Error invalidando cache con patrón [${pattern}]:`,
        error,
      );
    }
  }

  /**
   * Limpia todo el cache (solo para memory cache)
   */
  async clear(): Promise<void> {
    if (!this.cacheManager) return;

    try {
      // Para cache-manager v6+, se usa del con un patrón vacío
      const keys = await (this.cacheManager as any).store?.keys?.();
      if (keys && Array.isArray(keys)) {
        for (const key of keys) {
          await this.cacheManager.del(key);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error limpiando cache:', error);
    }
  }
}
