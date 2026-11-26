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

@Entity('table_reports')
@Index(['campaignId'])
@Index(['votingBoothId', 'tableNumber'])
@Index(['createdAt'])
export class TableReport {
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

  @Column({ length: 50 })
  status: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  estimatedParticipation: number | null;

  @Column({ type: 'text', nullable: true })
  observations: string | null;

  /** URL pública de descarga (API) o externa legacy */
  @Column({ type: 'text', nullable: true })
  evidenceUrl: string | null;

  /** Ruta relativa dentro de /uploads */
  @Column({ type: 'text', nullable: true })
  evidencePath: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  evidenceOriginalName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  evidenceMimeType: string | null;

  @Column({ type: 'bigint', nullable: true })
  evidenceSizeBytes: number | null;

  @Column()
  createdByUserId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser: User;

  @CreateDateColumn()
  createdAt: Date;
}
