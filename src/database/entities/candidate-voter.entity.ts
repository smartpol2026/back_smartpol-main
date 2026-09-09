import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Voter } from './voter.entity';
import { Candidate } from './candidate.entity';
import { Leader } from './leader.entity';

@Entity('candidate_voter')
@Index(['voterId'])
@Index(['candidateId'])
@Index(['leaderId'])
export class CandidateVoter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('integer', { name: 'voter_id' })
  voterId: number;

  @ManyToOne(() => Voter)
  @JoinColumn({ name: 'voter_id' })
  voter: Voter;

  @Column('integer', { name: 'candidate_id' })
  candidateId: number;

  @ManyToOne(() => Candidate)
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  @Column('integer', { name: 'leader_id', nullable: true })
  leaderId?: number | null;

  @ManyToOne(() => Leader, { nullable: true })
  @JoinColumn({ name: 'leader_id' })
  leader?: Leader | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}