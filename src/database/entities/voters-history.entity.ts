import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('voters_history')
@Index(['identification'])
@Index(['recordedAt'])
export class VotersHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  identification: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  bloodType: string;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  departmentId: number;

  @Column({ nullable: true })
  municipalityId: number;

  @Column({ nullable: true })
  neighborhood: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  occupation: string;

  @Column({ nullable: true })
  votingBoothId: number;

  @Column({ nullable: true })
  votingTableId: string;

  @Column({ nullable: true })
  politicalStatus: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  recordedAt: Date;

  @Column({ nullable: true })
  createdByUserId: number;
}
