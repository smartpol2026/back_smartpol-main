import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  Index,
} from 'typeorm';
import { Campaign } from './campaigns.entity';
import { User } from './user.entity';

@Entity('campaign_users')
@Index(['campaignId'])
@Index(['userId'])
@Index(['campaignId', 'userId'])
export class CampaignUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Campaign, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column()
  campaignId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}