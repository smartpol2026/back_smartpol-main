import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from '../../database/entities/candidate.entity';
import { Leader } from '../../database/entities/leader.entity';
import { User } from '../../database/entities/user.entity';
import { CandidateService } from './candidate.service';
import { CandidateController } from './candidate.controller';
import { Campaign } from 'src/database/entities';
import { UserModule } from '../users/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate, Leader, User, Campaign]),
    UserModule,
  ],
  controllers: [CandidateController],
  providers: [CandidateService],
  exports: [CandidateService],
})
export class CandidateModule {}
