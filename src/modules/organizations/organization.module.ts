import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../../database/entities/organizations.entity';
import { User } from '../../database/entities/user.entity';
import { Campaign } from '../../database/entities/campaigns.entity';
import { Candidate } from '../../database/entities/candidate.entity';
import { Leader } from '../../database/entities/leader.entity';
import { CampaignUser } from '../../database/entities/campaign-user.entity';
import { CandidateVoter } from '../../database/entities/candidate-voter.entity';
import { OrganizationsService } from './organization.service';
import { OrganizationsController } from './organization.controller';
import { UserModule } from '../users/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      User,
      Campaign,
      Candidate,
      Leader,
      CampaignUser,
      CandidateVoter,
    ]),
    UserModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
