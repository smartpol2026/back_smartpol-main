import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Role } from './role.entity';
import { UserPermission } from './user-permission.entity';
import { Organization } from './organizations.entity';
import { CampaignUser } from './campaign-user.entity';

@Entity('users')
@Index(['email'])
@Index(['roleId'])
@Index(['organizationId'])
@Index(['createdAt'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  roleId: number;

  @ManyToOne(() => Role, (role) => role.users, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @OneToMany(() => UserPermission, (up) => up.user)
  permissions: UserPermission[];

  // Un usuario puede pertenecer a una organización
  @ManyToOne(() => Organization, (organization) => organization.users, { nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ nullable: true })
  organizationId: number;
  // Un usuario puede estar en muchas campañas a través de CampaignUser
  @OneToMany(() => CampaignUser, (campaignUser) => campaignUser.user)
  campaignUsers: CampaignUser[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
