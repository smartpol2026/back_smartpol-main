import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { UserPermission } from './user-permission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  resource: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions: RolePermission[];

  @OneToMany(() => UserPermission, (up) => up.permission)
  userPermissions: UserPermission[];
}
