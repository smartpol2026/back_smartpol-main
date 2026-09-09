import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Municipality } from '../../database/entities/municipality.entity';
import { MunicipalityService } from './municipality.service';
import { MunicipalityController } from './municipality.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Municipality])],
  controllers: [MunicipalityController],
  providers: [MunicipalityService],
  exports: [MunicipalityService],
})
export class MunicipalityModule {}
