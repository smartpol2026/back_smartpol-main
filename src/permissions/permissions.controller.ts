import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PermissionsService } from './permissions.service';
import { Permission } from './permission.decorator';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('all')
  @ApiOperation({ summary: 'Get all available permissions' })
  async getAllPermissions() {
    return await this.permissionsService.getAllPermissions();
  }

  @Get('by-resource')
  @ApiOperation({ summary: 'Get permissions grouped by resource' })
  async getPermissionsByResource() {
    return await this.permissionsService.getPermissionsByResource();
  }

  @Get('users')
  @Permission('permissions:read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with their roles' })
  async getAllUsers() {
    return await this.permissionsService.getAllUsers();
  }

  @Get('roles')
  @Permission('permissions:read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all roles' })
  async getAllRoles() {
    return await this.permissionsService.getAllRoles();
  }

  @Get('roles/:roleId/permissions')
  @Permission('permissions:read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get permissions for a specific role' })
  async getRolePermissions(@Param('roleId') roleId: string) {
    return await this.permissionsService.getRolePermissions(parseInt(roleId));
  }

  @Get('users/:userId/custom-permissions')
  @Permission('permissions:read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get custom permissions for a specific user' })
  async getUserCustomPermissions(@Param('userId') userId: string) {
    return await this.permissionsService.getUserCustomPermissions(
      parseInt(userId),
    );
  }

  @Post('roles/:roleId/permissions/:permissionId')
  @Permission('permissions:update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign a permission to a role' })
  async assignPermissionToRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    await this.permissionsService.assignPermissionToRole(
      parseInt(roleId),
      parseInt(permissionId),
    );
    return { message: 'Permission assigned successfully' };
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  @Permission('permissions:update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a permission from a role' })
  async revokePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    await this.permissionsService.revokePermissionFromRole(
      parseInt(roleId),
      parseInt(permissionId),
    );
    return { message: 'Permission revoked successfully' };
  }

  @Post('users/:userId/permissions/:permissionId')
  @Permission('permissions:update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Set user permission state (grant or revoke from role)',
  })
  async setUserPermission(
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
    @Body('granted') granted?: boolean,
  ) {
    const permission = await this.permissionsService.getPermissionById(
      parseInt(permissionId),
    );
    if (!permission) {
      throw new Error('Permission not found');
    }
    // Si no se proporciona granted, asumir true
    const grantedValue = granted !== undefined ? granted : true;
    await this.permissionsService.setUserPermission(
      parseInt(userId),
      permission.name,
      grantedValue,
    );
    return {
      message: `Permission ${grantedValue ? 'granted' : 'revoked'} successfully`,
    };
  }

  @Delete('users/:userId/permissions/:permissionId')
  @Permission('permissions:update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a custom permission from a user' })
  async deleteUserPermission(
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
  ) {
    const permission = await this.permissionsService.getPermissionById(
      parseInt(permissionId),
    );
    if (!permission) {
      throw new Error('Permission not found');
    }
    await this.permissionsService.deleteUserPermission(
      parseInt(userId),
      permission.name,
    );
    return { message: 'Permission deleted successfully' };
  }
}
