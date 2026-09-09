import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

/**
 * Decorador para especificar el permiso requerido en una ruta
 *
 * Soporta dos modos:
 * - Single permission: @Permission('candidates:read')
 * - Multiple permissions (OR logic): @Permission(['candidates:read', 'candidates:manage'])
 *
 * IMPORTANTE sobre la nueva estructura de permisos:
 * - resource:read = acceso de lectura únicamente
 * - resource:manage = gestión completa (create, update, delete)
 * - resource:create/update/delete = se satisfacen automáticamente si existe resource:manage
 *
 * @param permission Nombre del permiso (ej: 'candidates:read') o array de permisos
 */
export const Permission = (permission: string | string[]) =>
  SetMetadata(PERMISSION_KEY, permission);
