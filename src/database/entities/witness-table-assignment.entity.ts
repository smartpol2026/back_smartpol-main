import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Campaign } from './campaigns.entity';
import { VotingBooth } from './voting-booth.entity';

@Entity('witness_table_assignments')
@Unique(['userId', 'campaignId'])
@Unique(['campaignId', 'votingBoothId', 'tableNumber'])
@Index(['userId'])
@Index(['campaignId'])
@Index(['votingBoothId'])
export class WitnessTableAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  campaignId: number;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column()
  votingBoothId: number;

  @ManyToOne(() => VotingBooth, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'votingBoothId' })
  votingBooth: VotingBooth;

  @Column()
  tableNumber: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
