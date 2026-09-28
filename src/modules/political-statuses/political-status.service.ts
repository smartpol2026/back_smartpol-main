import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoliticalStatus } from '../../database/entities/political-status.entity';
import { CreatePoliticalStatusDto } from './dto/create-political-status.dto';
import { UpdatePoliticalStatusDto } from './dto/update-political-status.dto';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class PoliticalStatusService {
  constructor(
    @InjectRepository(PoliticalStatus)
    private readonly politicalStatusRepository: Repository<PoliticalStatus>,
    @Optional()
    private readonly cacheService?: CacheService,
  ) {}

  async create(
    createPoliticalStatusDto: CreatePoliticalStatusDto,
  ): Promise<PoliticalStatus> {
    const politicalStatus = this.politicalStatusRepository.create(
      createPoliticalStatusDto,
    );
    const result = await this.politicalStatusRepository.save(politicalStatus);

    if (this.cacheService) {
      await this.cacheService.invalidate('political-statuses:all');
    }

    return result;
  }

  async findAll(): Promise<PoliticalStatus[]> {
    if (this.cacheService) {
      return this.cacheService.get(
        'political-statuses:all',
        () =>
          this.politicalStatusRepository.find({
            order: { name: 'ASC' },
          }),
        3600,
      );
    }

    return this.politicalStatusRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<PoliticalStatus | null> {
    if (this.cacheService) {
      return this.cacheService.get(
        `political-status:${id}`,
        () => this.politicalStatusRepository.findOneBy({ id }),
        3600,
      );
    }

    return this.politicalStatusRepository.findOneBy({ id });
  }

  async update(
    id: number,
    updatePoliticalStatusDto: UpdatePoliticalStatusDto,
  ): Promise<PoliticalStatus | null> {
    await this.politicalStatusRepository.update(id, updatePoliticalStatusDto);

    if (this.cacheService) {
      await this.cacheService.invalidate(`political-status:${id}`);
      await this.cacheService.invalidate('political-statuses:all');
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.politicalStatusRepository.delete(id);

    if (this.cacheService) {
      await this.cacheService.invalidate(`political-status:${id}`);
      await this.cacheService.invalidate('political-statuses:all');
    }
  }
}
