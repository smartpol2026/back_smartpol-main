import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Permission,
  RolePermission,
  UserPermission,
  User,
  Role,
} from '../database/entities';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class PermissionsService {
  private permissionCache: Map<string, boolean> = new Map();

  constructor(
    @InjectRepository(Permission)
    private permissionsRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionsRepo: Repository<RolePermission>,
    @InjectRepository(UserPermission)
    private userPermissionsRepo: Repository<UserPermission>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Role)
    private rolesRepo: Repository<Role>,
    @Optional()
    private readonly cacheService?: CacheService,
  ) {}

  /**
   * Verifica si un usuario tiene un permiso específico
   * Lógica: permisos personalizados > permisos del rol
   *
   * IMPORTANTE: Los permisos "manage" incluyen automáticamente create, update, delete
   * Ej: Si tienes 'candidates:manage', también tienes 'candidates:create', 'candidates:update', 'candidates:delete'
   */
  async hasPermission(
    userId: number,
    permissionName: string,
    roleId?: number,
  ): Promise<boolean> {
    if (!roleId) {
      // Si no hay rol, denegar acceso
      return false;
    }

    const cacheKey = `${userId}:${permissionName}`;

    // Verificar caché
    if (this.permissionCache.has(cacheKey)) {
      const cached = this.permissionCache.get(cacheKey);
      return cached ?? false;
    }

    // 1. Buscar permiso específico del usuario
    const userPermission = await this.userPermissionsRepo.findOne({
      where: { user: { id: userId }, permission: { name: permissionName } },
      relations: ['permission'],
    });

    if (userPermission) {
      this.permissionCache.set(cacheKey, userPermission.granted);
      return userPermission.granted;
    }

    // 2. Si no existe permiso específico, usar permiso del rol
    let rolePermission = await this.rolePermissionsRepo.findOne({
      where: { role: { id: roleId }, permission: { name: permissionName } },
      relations: ['permission'],
    });

    // 3. Si el permiso solicitado es create/update/delete, verificar también si tiene 'manage'
    if (!rolePermission && this.isActionPermission(permissionName)) {
      const [resource, action] = permissionName.split(':');
      const managePermissionName = `${resource}:manage`;

      rolePermission = await this.rolePermissionsRepo.findOne({
        where: {
          role: { id: roleId },
          permission: { name: managePermissionName },
        },
        relations: ['permission'],
      });
    }

    const hasAccess = !!rolePermission;
    this.permissionCache.set(cacheKey, hasAccess);
    return hasAccess;
  }

  /**
   * Verifica si el permiso solicitado es de acción (create, update, delete)
   * Estos permisos pueden ser satisfechos por el permiso 'manage'
   */
  private isActionPermission(permissionName: string): boolean {
    const action = permissionName.split(':')[1];
    return ['create', 'update', 'delete'].includes(action);
  }

  /**
   * Obtiene todos los permisos de un usuario (rol + personalizados)
   * Nota: Expande automáticamente los permisos 'manage' a 'create', 'update', 'delete'
   */
  async getUserPermissions(userId: number, roleId: number): Promise<string[]> {
    // Permisos del rol
    const rolePerms = await this.rolePermissionsRepo.find({
      where: { role: { id: roleId } },
      relations: ['permission'],
    });

    const permissionNames = new Set(rolePerms.map((rp) => rp.permission.name));

    // Permisos personalizados del usuario
    const userPerms = await this.userPermissionsRepo.find({
      where: { user: { id: userId } },
      relations: ['permission'],
    });

    // Agregar/remover permisos personalizados
    userPerms.forEach((up) => {
      if (up.granted) {
        permissionNames.add(up.permission.name);
      } else {
        permissionNames.delete(up.permission.name);
      }
    });

    // Expandir permisos 'manage' a create/update/delete
    const expandedPermissions = new Set(permissionNames);
    permissionNames.forEach((perm) => {
      if (perm.endsWith(':manage')) {
        const resource = perm.split(':')[0];
        expandedPermissions.add(`${resource}:create`);
        expandedPermissions.add(`${resource}:update`);
        expandedPermissions.add(`${resource}:delete`);
      }
    });

    return Array.from(expandedPermissions);
  }

  /**
   * Otorga un permiso personalizado a un usuario
   */
  async grantPermission(userId: number, permissionName: string): Promise<void> {
    const permission = await this.permissionsRepo.findOne({
      where: { name: permissionName },
    });

    if (!permission) {
      throw new Error(`Permiso "${permissionName}" no existe`);
    }

    await this.userPermissionsRepo.upsert(
      {
        userId,
        permissionId: permission.id,
        granted: true,
      },
      ['userId', 'permissionId'],
    );

    this.invalidateCache(userId, permissionName);
  }

  /**
   * Revoca un permiso personalizado de un usuario
   */
  async revokePermission(
    userId: number,
    permissionName: string,
  ): Promise<void> {
    const permission = await this.permissionsRepo.findOne({
      where: { name: permissionName },
    });

    if (!permission) {
      throw new Error(`Permiso "${permissionName}" no existe`);
    }

    await this.userPermissionsRepo.upsert(
      {
        userId,
        permissionId: permission.id,
        granted: false,
      },
      ['userId', 'permissionId'],
    );

    this.invalidateCache(userId, permissionName);
  }

  /**
   * Establece el estado de un permiso personalizado para un usuario
   * granted: true = otorgar permiso adicional (no heredado del rol)
   * granted: false = revocar permiso heredado del rol
   * Si se llama nuevamente con el mismo estado, se borra el registro
   */
  async setUserPermission(
    userId: number,
    permissionName: string,
    granted: boolean,
  ): Promise<void> {
    const permission = await this.permissionsRepo.findOne({
      where: { name: permissionName },
    });

    if (!permission) {
      throw new Error(`Permiso "${permissionName}" no existe`);
    }

    // Verificar si ya existe un registro de permiso personalizado
    const existingPermission = await this.userPermissionsRepo.findOne({
      where: {
        user: { id: userId },
        permission: { id: permission.id },
      },
    });

    // Si ya existe y tiene el mismo estado, eliminar (volver al estado natural)
    if (existingPermission && existingPermission.granted === granted) {
      await this.userPermissionsRepo.delete({
        userId,
        permissionId: permission.id,
      });
    } else {
      // Si no existe o tiene diferente estado, upsert con el nuevo estado
      await this.userPermissionsRepo.upsert(
        {
          userId,
          permissionId: permission.id,
          granted,
        },
        ['userId', 'permissionId'],
      );
    }

    // Invalidar caché tanto del permiso específico como todo el caché del usuario
    this.invalidateCache(userId, permissionName);
    // Limpiar caché general para asegurar que se obtienen datos frescos
    this.clearCache();
  }

  /**
   * Elimina un permiso personalizado de un usuario (limpia la excepción)
   * No UPSERT, DELETE real
   */
  async deleteUserPermission(
    userId: number,
    permissionName: string,
  ): Promise<void> {
    const permission = await this.permissionsRepo.findOne({
      where: { name: permissionName },
    });

    if (!permission) {
      throw new Error(`Permiso "${permissionName}" no existe`);
    }

    await this.userPermissionsRepo.delete({
      userId,
      permissionId: permission.id,
    });

    this.invalidateCache(userId, permissionName);
    // Limpiar caché general para asegurar que se obtienen datos frescos
    this.clearCache();
  }

  /**
   * Obtiene todos los permisos disponibles
   */
  async getAllPermissions(): Promise<Permission[]> {
    if (this.cacheService) {
      return await this.cacheService.get(
        'permissions:all',
        () =>
          this.permissionsRepo.find({
            order: { resource: 'ASC', action: 'ASC' },
          }),
        3600, // 1 hora
      );
    }
    return this.permissionsRepo.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  /**
   * Obtiene un permiso por ID
   */
  async getPermissionById(id: number): Promise<Permission | null> {
    if (this.cacheService) {
      return await this.cacheService.get(
        `permission:${id}`,
        () => this.permissionsRepo.findOne({ where: { id } }),
        3600,
      );
    }
    return this.permissionsRepo.findOne({ where: { id } });
  }

  /**
   * Obtiene permisos agrupados por recurso
   */
  async getPermissionsByResource(): Promise<Record<string, Permission[]>> {
    if (this.cacheService) {
      return await this.cacheService.get(
        'permissions:by-resource',
        async () => {
          const permissions = await this.getAllPermissions();
          return permissions.reduce(
            (acc, perm) => {
              if (!acc[perm.resource]) {
                acc[perm.resource] = [];
              }
              acc[perm.resource].push(perm);
              return acc;
            },
            {} as Record<string, Permission[]>,
          );
        },
        3600,
      );
    }

    const permissions = await this.getAllPermissions();
    return permissions.reduce(
      (acc, perm) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = [];
        }
        acc[perm.resource].push(perm);
        return acc;
      },
      {} as Record<string, Permission[]>,
    );
  }

  /**
   * Invalida el caché de un permiso
   */
  private invalidateCache(userId: number, permissionName: string): void {
    const cacheKey = `${userId}:${permissionName}`;
    this.permissionCache.delete(cacheKey);
  }

  /**
   * Limpia todo el caché
   */
  clearCache(): void {
    this.permissionCache.clear();
    if (this.cacheService) {
      this.cacheService.invalidate('permissions:all');
      this.cacheService.invalidate('permissions:by-resource');
      this.cacheService.invalidate('roles:all');
      this.cacheService.invalidate('users:all');
    }
  }

  /**
   * Obtiene todos los usuarios con su rol
   */
  async getAllUsers(): Promise<User[]> {
    if (this.cacheService) {
      return await this.cacheService.get(
        'users:all',
        () =>
          this.usersRepo.find({
            relations: ['role'],
            order: { email: 'ASC' },
          }),
        1800, // 30 minutos
      );
    }
    return this.usersRepo.find({
      relations: ['role'],
      order: { email: 'ASC' },
    });
  }

  /**
   * Obtiene todos los roles
   */
  async getAllRoles(): Promise<Role[]> {
    if (this.cacheService) {
      return await this.cacheService.get(
        'roles:all',
        () =>
          this.rolesRepo.find({
            order: { id: 'ASC' },
          }),
        3600,
      );
    }
    return this.rolesRepo.find({
      order: { id: 'ASC' },
    });
  }

  /**
   * Obtiene los permisos de un rol específico
   */
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    if (this.cacheService) {
      return await this.cacheService.get(
        `role:${roleId}:permissions`,
        async () => {
          const rolePerms = await this.rolePermissionsRepo.find({
            where: { role: { id: roleId } },
            relations: ['permission'],
          });
          return rolePerms.map((rp) => rp.permission);
        },
        3600,
      );
    }

    const rolePerms = await this.rolePermissionsRepo.find({
      where: { role: { id: roleId } },
      relations: ['permission'],
    });
    return rolePerms.map((rp) => rp.permission);
  }

  /**
   * Obtiene los permisos personalizados de un usuario
   */
  async getUserCustomPermissions(userId: number): Promise<UserPermission[]> {
    return this.userPermissionsRepo.find({
      where: { user: { id: userId } },
      relations: ['permission'],
    });
  }

  /**
   * Asigna un permiso a un rol
   */
  async assignPermissionToRole(
    roleId: number,
    permissionId: number,
  ): Promise<void> {
    await this.rolePermissionsRepo.upsert(
      {
        roleId,
        permissionId,
      },
      ['roleId', 'permissionId'],
    );
    this.clearCache();
  }

  /**
   * Revoca un permiso de un rol
   */
  async revokePermissionFromRole(
    roleId: number,
    permissionId: number,
  ): Promise<void> {
    await this.rolePermissionsRepo.delete({
      roleId,
      permissionId,
    });
    this.clearCache();
  }
}
