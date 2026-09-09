import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from './permissions.service';
import { PERMISSION_KEY } from './permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtener el permiso requerido del decorador
    const requiredPermission = this.reflector.get<string | string[]>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    // Si no hay permiso requerido, permitir acceso
    if (!requiredPermission) {
      return true;
    }

    // Obtener el usuario del request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Si no hay usuario autenticado, denegar
    if (!user || !user.id) {
      throw new ForbiddenException('No autenticado');
    }

    const roleId = user.roleId || user.role?.id;

    // Soportar tanto string como array de permisos
    const permissionsToCheck = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];

    // Verificar si el usuario tiene ALGUNO de los permisos (OR logic)
    for (const permission of permissionsToCheck) {
      const hasPermission = await this.permissionsService.hasPermission(
        user.id,
        permission,
        roleId,
      );

      if (hasPermission) {
        return true;
      }
    }

    // Si no tiene ninguno de los permisos, denegar
    throw new ForbiddenException(
      `No tiene permiso para: ${permissionsToCheck.join(' o ')}`,
    );
  }
}
