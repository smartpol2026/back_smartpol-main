# 🚀 Guía Rápida: Aplicar Cache a Otros Servicios

## Patrón genérico de cache para servicios

### 1. **Importa CacheService**

```typescript
import { Optional } from '@nestjs/common';
import { CacheService } from '../../common/cache/cache.service';
```

### 2. **Inyecta en constructor** (con @Optional)

```typescript
constructor(
  @InjectRepository(MyEntity)
  private readonly repository: Repository<MyEntity>,
  @Optional()  // ← IMPORTANTE!
  private readonly cacheService?: CacheService,
) {}
```

### 3. **Cachea métodos de lectura** (findAll, findOne, etc.)

```typescript
async findAll(): Promise<MyEntity[]> {
  if (this.cacheService) {
    return await this.cacheService.get(
      'myentity:all',           // clave única
      () => this.repository.find(...),  // función si no está en cache
      3600                      // TTL en segundos
    );
  }
  // Fallback si no hay cache
  return await this.repository.find(...);
}

async findOne(id: number): Promise<MyEntity | null> {
  if (this.cacheService) {
    return await this.cacheService.get(
      `myentity:${id}`,
      () => this.repository.findOne({ where: { id } }),
      3600
    );
  }
  return await this.repository.findOne({ where: { id } });
}
```

### 4. **Invalida en operaciones de escritura** (create, update, delete)

```typescript
async create(dto: CreateDto): Promise<MyEntity> {
  const entity = this.repository.create(dto);
  const result = await this.repository.save(entity);

  // Invalida cache después de crear
  if (this.cacheService) {
    await this.cacheService.invalidate('myentity:all');
  }

  return result;
}

async update(id: number, dto: UpdateDto): Promise<MyEntity | null> {
  await this.repository.update(id, dto);

  // Invalida
  if (this.cacheService) {
    await this.cacheService.invalidate(`myentity:${id}`);
    await this.cacheService.invalidate('myentity:all');
  }

  return await this.findOne(id);
}

async remove(id: number): Promise<void> {
  await this.repository.delete(id);

  // Invalida
  if (this.cacheService) {
    await this.cacheService.invalidate(`myentity:${id}`);
    await this.cacheService.invalidate('myentity:all');
  }
}
```

---

## ✅ Servicios prioritarios (aplica este patrón)

### 🔴 ALTA PRIORIDAD - Datos estáticos (cache 3600 segundos = 1 hora)

- [x] **departments** ✅ YA HECHO
- [x] **municipalities** ✅ YA HECHO
- [ ] **permissions**
  - `findAll()` → `permissions:all`
  - `findOne()` → `permission:${id}`
- [ ] **roles** (si existe un roles.service.ts)
  - `findAll()` → `roles:all`
  - `findOne()` → `role:${id}`
- [ ] **organizations**
  - `findAll()` → `organizations:all`
  - `findOne()` → `organization:${id}`

### 🟡 MEDIA PRIORIDAD - Datos semi-estáticos (cache 1800 segundos = 30 min)

- [x] **candidates** ✅ YA HECHO
- [ ] **leaders**
  - `findAll()` → `leaders:all`
  - `findOne()` → `leader:${id}`
  - `findByCorporation()` → `leaders:corp:${corpId}`
- [ ] **corporations**
  - `findAll()` → `corporations:all`
  - `findOne()` → `corporation:${id}`
- [ ] **campaigns**
  - `findAll()` → `campaigns:all`
  - `findOne()` → `campaign:${id}`

### 🟢 USUARIO/AUTENTICACIÓN (cache 1800 segundos)

- [ ] **users** - Solo lectura
  - `findAll()` → `users:all`
  - `findOne()` → `user:${id}`
  - `findByEmail()` → `user:email:${email}`

---

## 📋 Checklist para cada servicio

- [ ] Importar `{ Optional }` en el import de `@nestjs/common`
- [ ] Importar `CacheService` desde `../../common/cache/cache.service`
- [ ] Agregar `@Optional() private readonly cacheService?: CacheService` en constructor
- [ ] Wrappear todos los `async find*()` con `this.cacheService.get()`
- [ ] Llamar `this.cacheService.invalidate()` en `create()`, `update()`, `delete()`
- [ ] Probar que funciona con `pnpm start:dev`

---

## 💡 Consejos

### Keys de cache (deben ser únicas y descriptivas)

```typescript
// ✅ BUENOS
'entities:all';
'entity:123';
'entity:name:jose';
'entities:dept:5';

// ❌ MALOS
'data';
'results';
'cache';
```

### TTL (Time To Live)

```typescript
// Datos casi nunca cambian
3600; // 1 hora

// Datos que cambian moderadamente
1800; // 30 minutos

// Datos que cambian frecuentemente
300; // 5 minutos

// Datos que se actualizan constantemente
0; // No cachear
```

### Invalidar múltiples keys relacionadas

```typescript
async update(id: number, dto: UpdateDto): Promise<MyEntity> {
  const existing = await this.findOne(id);  // obtén los datos viejos
  await this.repository.update(id, dto);

  if (this.cacheService) {
    // Invalida el elemento específico
    await this.cacheService.invalidate(`myentity:${id}`);

    // Invalida listados
    await this.cacheService.invalidate('myentity:all');

    // Invalida búsquedas relacionadas (si aplica)
    if (existing?.departmentId) {
      await this.cacheService.invalidate(`myentity:dept:${existing.departmentId}`);
    }
  }

  return await this.findOne(id);
}
```

---

## 🧪 Cómo verificar que el cache funciona

### Opción 1: Usar logs

```typescript
async findOne(id: number): Promise<MyEntity | null> {
  if (this.cacheService) {
    const start = Date.now();
    const result = await this.cacheService.get(
      `myentity:${id}`,
      async () => {
        console.log(`🔍 Query BD para entity:${id}`);
        return this.repository.findOne({ where: { id } });
      },
      3600
    );
    const duration = Date.now() - start;
    console.log(`⚡ Response time: ${duration}ms`);
    return result;
  }
  return this.repository.findOne({ where: { id } });
}
```

### Opción 2: Endpoint de prueba

```typescript
// En app.controller.ts o un controller de testing
@Get('/test-cache')
async testCache() {
  let t1 = Date.now();
  await this.candidateService.findAll();
  const primera = Date.now() - t1;

  t1 = Date.now();
  await this.candidateService.findAll();
  const segunda = Date.now() - t1;

  return {
    primera_llamada: `${primera}ms (BD)`,
    segunda_llamada: `${segunda}ms (cache)`,
    mejora: `${((1 - segunda/primera) * 100).toFixed(0)}%`
  };
}
```

---

## 🚨 Errores comunes y soluciones

### ❌ Error: "Cannot find name 'Optional'"

**Solución**: Importar en la línea de imports

```typescript
import { Injectable, Optional } from '@nestjs/common'; // ← agregar Optional
```

### ❌ Error: "CacheService is not provided"

**Solución**: CacheService es @Optional, esto no es error

### ❌ El cache siempre trae datos viejos

**Solución**: Olvidas invalidar en update/delete

```typescript
// SIEMPRE invalidar después de modificar
if (this.cacheService) {
  await this.cacheService.invalidate(`myentity:${id}`);
  await this.cacheService.invalidate('myentity:all');
}
```

### ❌ Performance no mejora

- Verifica que estás cacheando consultas que se repiten
- Aumenta el TTL si los datos casi no cambian
- Usa Redis en lugar de memory cache
- Verifica los logs para ver si se hace hit de cache

---

## 📞 Resumen rápido

```typescript
// 1. Importa
import { Optional } from '@nestjs/common';
import { CacheService } from '../../common/cache/cache.service';

// 2. Inyecta
constructor(
  private repo: Repository<Entity>,
  @Optional() private cache?: CacheService
) {}

// 3. Achea lecturas
async findAll() {
  if (this.cache) {
    return await this.cache.get('key', () => this.repo.find(), 3600);
  }
  return this.repo.find();
}

// 4. Invalida escrituras
async create(dto) {
  const result = await this.repo.save(this.repo.create(dto));
  if (this.cache) await this.cache.invalidate('key');
  return result;
}
```

**¡Listo! Copia-pega este patrón a todos los servicios y doblarás el performance** 🚀
