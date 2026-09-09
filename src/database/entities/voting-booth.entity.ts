import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Municipality } from './municipality.entity';

@Entity('voting_booths')
@Unique(['code', 'municipalityId'])
@Index(['municipalityId'])
@Index(['code'])
export class VotingBooth {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @ManyToOne(() => Municipality, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'municipalityId' })
  municipality: Municipality;

  @Column()
  municipalityId: number;

  @Column()
  mesas: number;
}
