import {
  Entity,
  ManyToOne,
  PrimaryColumn,
  Column,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Permission } from './permission.entity';

@Entity('user_permissions')
export class UserPermission {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  permissionId: number;

  @Column({ default: true })
  granted: boolean;

  @ManyToOne(() => User, (user) => user.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Permission, (permission) => permission.userPermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permissionId' })
  permission: Permission;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
