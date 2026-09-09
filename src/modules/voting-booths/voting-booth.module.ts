import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VotingBooth } from '../../database/entities/voting-booth.entity';
import { VotingBoothController } from './voting-booth.controller';
import { VotingBoothService } from './voting-booth.service';

@Module({
  imports: [TypeOrmModule.forFeature([VotingBooth])],
  controllers: [VotingBoothController],
  providers: [VotingBoothService],
  exports: [VotingBoothService],
})
export class VotingBoothModule {}