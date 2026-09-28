import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoliticalStatus } from '../../database/entities/political-status.entity';
import { PoliticalStatusService } from './political-status.service';
import { PoliticalStatusController } from './political-status.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PoliticalStatus])],
  controllers: [PoliticalStatusController],
  providers: [PoliticalStatusService],
  exports: [PoliticalStatusService],
})
export class PoliticalStatusModule {}
