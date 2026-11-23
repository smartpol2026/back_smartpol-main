import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Campaign } from './campaigns.entity';
import { VotingBooth } from './voting-booth.entity';
import { User } from './user.entity';

@Entity('table_novelties')
@Index(['campaignId'])
@Index(['votingBoothId', 'tableNumber'])
@Index(['severity'])
@Index(['createdAt'])
export class TableNovelty {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ length: 20 })
  severity: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column()
  createdByUserId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser: User;

  @CreateDateColumn()
  createdAt: Date;
}
