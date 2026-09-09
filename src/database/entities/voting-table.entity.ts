import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VotingBooth } from './voting-booth.entity';

@Entity('voting_tables')
export class VotingTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tableNumber: number;

  @ManyToOne(() => VotingBooth, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'votingBoothId' })
  votingBooth: VotingBooth;

  @Column()
  votingBoothId: number;
}
