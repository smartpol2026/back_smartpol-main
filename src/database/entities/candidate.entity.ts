import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Corporation } from './corporation.entity';
import { Leader } from './leader.entity';
import { Voter } from './voter.entity';
import { User } from './user.entity';
import { Campaign } from './campaigns.entity';

@Entity('candidates')
@Index(['name'])
@Index(['party'])
@Index(['number'])
@Index(['corporation_id'])
@Index(['userId'])
@Index(['campaignId'])
@Index(['createdAt'])
export class Candidate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  party: string;

  @Column()
  number: number;

  @ManyToOne(() => Corporation, (corporation) => corporation.candidates)
  @JoinColumn({ name: 'corporation_id' })
  corporation: Corporation;

  @Column()
  corporation_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => Campaign, (campaign) => campaign.candidates, { nullable: true })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column({ nullable: true })
  campaignId: number;

  @ManyToMany(() => Leader, (leader) => leader.candidates, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'candidate_leader',
    joinColumn: { name: 'candidate_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'leader_id', referencedColumnName: 'id' },
  })
  leaders: Leader[];

  @ManyToMany(() => Voter, (voter) => voter.candidates, { cascade: true })
  @JoinTable({
    name: 'candidate_voter',
    joinColumn: { name: 'candidate_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'voter_id', referencedColumnName: 'id' },
  })
  voters: Voter[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}