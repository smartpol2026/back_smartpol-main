import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from './organizations.entity';
import { CampaignUser } from './campaign-user.entity';
import { Candidate } from './candidate.entity'
import { Leader } from './leader.entity';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @ManyToOne(() => Organization, { nullable: false, eager: true })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  organizationId: number;

  @OneToMany(() => CampaignUser, (campaignUser) => campaignUser.campaign)
  campaignUsers: CampaignUser[];

  @OneToMany(() => Candidate, (candidate) => candidate.campaign)
  candidates: Candidate[];

  @OneToMany(() => Leader, (leader) => leader.campaign)
  leaders: Leader[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}