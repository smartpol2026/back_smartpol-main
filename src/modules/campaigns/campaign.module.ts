import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsService } from './campaign.service';
import { CampaignsController } from './campaign.controller';
import { Campaign } from '../../database/entities/campaigns.entity';
import { CampaignUser } from '../../database/entities/campaign-user.entity';
import { Candidate, Leader } from 'src/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, CampaignUser, Candidate, Leader])],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}