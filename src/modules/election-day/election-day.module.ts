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
import { EvidenceStorageService } from './evidence-storage.service';
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../../permissions/permissions.module';
import { ElectionDayGateway } from './election-day.gateway';
import { ElectionDayRealtimeService } from './election-day-realtime.service';
import { ControlBoardController } from './control-board.controller';

@Module({
  imports: [
    AuthModule,
    PermissionsModule,
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
  controllers: [ElectionDayController, ControlBoardController],
  providers: [
    ElectionDayService,
    EvidenceStorageService,
    ElectionDayRealtimeService,
    ElectionDayGateway,
  ],
  exports: [ElectionDayService],
})
export class ElectionDayModule {}
