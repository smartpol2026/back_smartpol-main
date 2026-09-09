import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Candidate } from './candidate.entity';
import { Leader } from './leader.entity';
import { Department } from './department.entity';
import { Municipality } from './municipality.entity';
import { VotingBooth } from './voting-booth.entity';
import { User } from './user.entity';

@Entity('voters')
@Index(['identification'])
@Index(['departmentId'])
@Index(['municipalityId'])
@Index(['votingBoothId'])
@Index(['firstName', 'lastName'])
@Index(['email'])
@Index(['phone'])
@Index(['createdByUserId'])
@Index(['hasVoted'])
export class Voter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  identification: string;

  @Column()
  gender: string;

  @Column()
  bloodType: string;

  @Column({ type: 'date' })
  birthDate: Date;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  departmentId: number;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Column({ nullable: true })
  municipalityId: number;

  @ManyToOne(() => Municipality, { nullable: true })
  @JoinColumn({ name: 'municipalityId' })
  municipality: Municipality;

  @Column({ nullable: true })
  neighborhood: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  occupation: string;

  @Column({ nullable: true })
  votingBoothId: number;

  @ManyToOne(() => VotingBooth, { nullable: true })
  @JoinColumn({ name: 'votingBoothId' })
  votingBooth: VotingBooth;

  @Column({ nullable: true })
  votingTableId: string;

  @Column({ nullable: true })
  politicalStatus: string;

  @ManyToMany(() => Candidate, (candidate) => candidate.voters)
  @JoinTable({
    name: 'candidate_voter',
    joinColumn: { name: 'voterId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'candidateId', referencedColumnName: 'id' },
  })
  candidates: Candidate[];

  // Mantener columna y relación para creador
  @Column({ nullable: true })
  createdByUserId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser: User;

  @Column({ name: 'hasvoted', default: false })
  hasVoted: boolean;
  // Mantener propiedad virtual de líderes
  leaders?: Leader[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}