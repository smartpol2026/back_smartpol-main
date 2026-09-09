import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Candidate } from './candidate.entity';
import { User } from './user.entity';
import { Campaign } from './campaigns.entity';

@Entity('leaders')
@Index(['name'])
@Index(['document'])
@Index(['municipality'])
@Index(['userId'])
@Index(['campaignId'])
@Index(['createdAt'])
export class Leader {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  document: string;

  @Column()
  municipality: string;

  @Column()
  phone: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => Campaign, (campaign) => campaign.leaders, { nullable: true })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column({ nullable: true })
  campaignId: number;

  @ManyToMany(() => Candidate, (candidate) => candidate.leaders)
  candidates: Candidate[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
