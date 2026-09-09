import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VotingTable } from '../../database/entities/voting-table.entity';
import { VotingTableController } from './voting-table.controller';
import { VotingTableService } from './voting-table.service';

@Module({
  imports: [TypeOrmModule.forFeature([VotingTable])],
  controllers: [VotingTableController],
  providers: [VotingTableService],
  exports: [VotingTableService],
})
export class VotingTableModule {}