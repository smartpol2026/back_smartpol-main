import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WitnessTableAssignment } from '../../database/entities/witness-table-assignment.entity';
import { TableReport } from '../../database/entities/table-report.entity';
import { TableNovelty } from '../../database/entities/table-novelty.entity';
import { CampaignUser } from '../../database/entities/campaign-user.entity';
import { User } from '../../database/entities/user.entity';
import { VotingBooth } from '../../database/entities/voting-booth.entity';
import { Campaign } from '../../database/entities/campaigns.entity';
import { ElectionDayService } from './election-day.service';
import { ElectionDayController } from './election-day.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WitnessTableAssignment,
      TableReport,
      TableNovelty,
      CampaignUser,
      User,
      VotingBooth,
      Campaign,
    ]),
  ],
  controllers: [ElectionDayController],
  providers: [ElectionDayService],
  exports: [ElectionDayService],
})
export class ElectionDayModule {}
