import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import {
  Permission,
  RolePermission,
  UserPermission,
  User,
  Role,
} from '../database/entities';
import { PermissionsService } from './permissions.service';
import { PermissionGuard } from './permission.guard';
import { PermissionsController } from './permissions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      RolePermission,
      UserPermission,
      User,
      Role,
    ]),
  ],
  controllers: [PermissionsController],
  providers: [
    PermissionsService,
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
  exports: [PermissionsService],
})
export class PermissionsModule {}
