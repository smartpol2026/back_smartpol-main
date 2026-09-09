import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Corporation } from '../../database/entities/corporation.entity';
import { CreateCorporationDto } from './dto/create-corporation.dto';
import { UpdateCorporationDto } from './dto/update-corporation.dto';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class CorporationService {
  constructor(
    @InjectRepository(Corporation)
    private readonly corporationRepository: Repository<Corporation>,
    @Optional()
    private readonly cacheService?: CacheService,
  ) {}

  async create(
    createCorporationDto: CreateCorporationDto,
  ): Promise<Corporation> {
    const corporation = this.corporationRepository.create(createCorporationDto);
    const result = await this.corporationRepository.save(corporation);

    if (this.cacheService) {
      await this.cacheService.invalidate('corporations:all');
    }

    return result;
  }

  async findAll(): Promise<Corporation[]> {
    if (this.cacheService) {
      return await this.cacheService.get(
        'corporations:all',
        () => this.corporationRepository.find(),
        3600,
      );
    }
    return await this.corporationRepository.find();
  }

  async findOne(id: number): Promise<Corporation | null> {
    if (this.cacheService) {
      return await this.cacheService.get(
        `corporation:${id}`,
        () => this.corporationRepository.findOneBy({ id }),
        3600,
      );
    }
    return await this.corporationRepository.findOneBy({ id });
  }

  async update(
    id: number,
    updateCorporationDto: UpdateCorporationDto,
  ): Promise<Corporation | null> {
    await this.corporationRepository.update(id, updateCorporationDto);

    if (this.cacheService) {
      await this.cacheService.invalidate(`corporation:${id}`);
      await this.cacheService.invalidate('corporations:all');
    }

    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.corporationRepository.delete(id);

    if (this.cacheService) {
      await this.cacheService.invalidate(`corporation:${id}`);
      await this.cacheService.invalidate('corporations:all');
    }
  }
}
