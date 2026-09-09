# Sistema de Cache con Redis (Opcional)

## ✅ Qué se ha configurado

### 1. **Módulo de Cache (`cache.module.ts`)**

- ✅ Cache global disponible en toda la aplicación
- ✅ Fallback automático a memory cache si Redis no está disponible
- ✅ Configurable por variables de entorno

### 2. **Servicio de Cache (`cache.service.ts`)**

- ✅ Métodos simples para cachear datos
- ✅ Invalidación automática de keys
- ✅ Manejo seguro de errores

### 3. **Configuración de Entorno (`.env`)**

```env
CACHE_TYPE=memory          # memory (default) o redis
REDIS_HOST=localhost        # Host de Redis
REDIS_PORT=6379            # Puerto de Redis
CACHE_TTL=300              # Tiempo de vida en segundos (5 min default)
```

## 🚀 Cómo usar en tus servicios

### Paso 1: Inyectar CacheService

```typescript
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class MyService {
  constructor(
    @InjectRepository(MyEntity)
    private readonly repository: Repository<MyEntity>,
    @Optional() // ⚠️ IMPORTANTE: @Optional() para que funcione sin cache
    private readonly cacheService?: CacheService,
  ) {}
}
```

### Paso 2: Cachear consultas de lectura

```typescript
async findAll(): Promise<MyEntity[]> {
  if (this.cacheService) {
    return await this.cacheService.get(
      'entities:all',                    // Clave única
      () => this.repository.find(),      // Función a ejecutar
      3600                               // TTL en segundos (1 hora)
    );
  }
  return this.repository.find();
}

async findOne(id: number): Promise<MyEntity> {
  if (this.cacheService) {
    return await this.cacheService.get(
      `entity:${id}`,
      () => this.repository.findOne({ where: { id } }),
      3600
    );
  }
  return this.repository.findOne({ where: { id } });
}
```

### Paso 3: Invalidar cache en operaciones de escritura

```typescript
async update(id: number, dto: UpdateDto): Promise<MyEntity> {
  await this.repository.update(id, dto);

  // 🔑 Invalida el cache después de actualizar
  if (this.cacheService) {
    await this.cacheService.invalidate(`entity:${id}`);
    await this.cacheService.invalidate('entities:all');
  }

  return await this.findOne(id);
}

async remove(id: number): Promise<void> {
  await this.repository.delete(id);

  // 🔑 Invalida el cache después de eliminar
  if (this.cacheService) {
    await this.cacheService.invalidate(`entity:${id}`);
    await this.cacheService.invalidate('entities:all');
  }
}
```

## 📋 Qué cachear (prioridades)

### 🔴 ALTA PRIORIDAD (cachea ASAP)

```
- Usuarios y Roles
- Permisos
- Departamentos y Municipios
- Candidatos (datos estáticos)
- Configuraciones globales
```

### 🟡 MEDIA PRIORIDAD

```
- Votantes (si hay buscas frecuentes)
- Votaciones por candidato/partido
- Reportes agregados
```

### 🟢 BAJA PRIORIDAD

```
- Datos que cambian constantemente
- Datos muy específicos por usuario
```

## 🏗️ Ejemplo de implementación

Ver `EXAMPLE_department.service.ts` en esta carpeta para un ejemplo completo.

## 🔧 Configuración para Producción

### Opción 1: Usar Redis (RECOMENDADO)

```bash
# Instala Redis en tu servidor
# En .env set:
CACHE_TYPE=redis
REDIS_HOST=tu-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=tu-password
CACHE_TTL=3600
```

### Opción 2: Usar Memory Cache (desarrollo/bajo volumen)

```env
CACHE_TYPE=memory
CACHE_TTL=300
```

## ⚠️ IMPORTANTE: Sistema seguro por defecto

Este sistema está configurado para ser **SEGURO**:

- ✅ Si Redis no está disponible → Usa memory cache automáticamente
- ✅ Si hay error en cache → Ejecuta query sin cachear
- ✅ CacheService es @Optional → Funciona incluso sin cache manager

**No romperá tu app** si algo falla.

## 📊 Impacto esperado

Con cache bien configurado:

- ⚡ **-60-80% consultas a BD** (menos queries)
- ⚡ **-200-500ms latencia** por request (usualmente)
- ⚡ **3-10x más throughput** (usuarios simultáneos)

## 🐛 Debugging

### Ver si cache funciona:

```typescript
// En app.service.ts o un endpoint de prueba
constructor(private cacheService: CacheService) {}

@Get('/test-cache')
async testCache() {
  let start = Date.now();
  await this.cacheService.get('test', async () => {
    await new Promise(r => setTimeout(r, 100));
    return 'datos';
  }, 10);
  const firstCall = Date.now() - start;

  start = Date.now();
  await this.cacheService.get('test', async () => {
    await new Promise(r => setTimeout(r, 100));
    return 'datos';
  }, 10);
  const secondCall = Date.now() - start;

  return { firstCall, secondCall, cached: secondCall < 5 };
}
```

## 📞 Preguntas frecuentes

**P: ¿Mi app funcionará sin Redis?**
R: ✅ Sí, usa memory cache automáticamente.

**P: ¿Se romperá algo si Inyecto CacheService?**
R: ❌ No, es @Optional, funciona con o sin él.

**P: ¿Cuándo debo cachear?**
R: En `findAll()`, `findOne()`, `findByX()` → consultas de lectura.

**P: ¿Cuándo invalido?**
R: En `create()`, `update()`, `delete()` → operaciones de escritura.

**P: ¿Timeout ideal para cache?**
R: 300-3600 segundos. Datos estáticos → más tiempo. Datos cambiantes → menos.
