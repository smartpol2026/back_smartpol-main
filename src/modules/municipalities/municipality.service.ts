import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Municipality } from '../../database/entities/municipality.entity';
import { CreateMunicipalityDto } from './dto/create-municipality.dto';
import { UpdateMunicipalityDto } from './dto/update-municipality.dto';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class MunicipalityService {
  constructor(
    @InjectRepository(Municipality)
    private readonly municipalityRepository: Repository<Municipality>,
    @Optional()
    private readonly cacheService?: CacheService,
  ) {}

  async create(
    createMunicipalityDto: CreateMunicipalityDto,
  ): Promise<Municipality> {
    const municipality = this.municipalityRepository.create(
      createMunicipalityDto,
    );
    const result = await this.municipalityRepository.save(municipality);

    if (this.cacheService) {
      await this.cacheService.invalidate('municipalities:all');
      if (result.departmentId) {
        await this.cacheService.invalidate(
          `municipalities:dept:${result.departmentId}`,
        );
      }
    }

    return result;
  }

  async findAll(): Promise<Municipality[]> {
    if (this.cacheService) {
      return await this.cacheService.get(
        'municipalities:all',
        () => this.municipalityRepository.find({ relations: ['department'] }),
        3600, // 1 hora
      );
    }

    return await this.municipalityRepository.find({
      relations: ['department'],
    });
  }

  async findOne(id: number): Promise<Municipality | null> {
    if (this.cacheService) {
      return await this.cacheService.get(
        `municipality:${id}`,
        () =>
          this.municipalityRepository.findOne({
            where: { id },
            relations: ['department'],
          }),
        3600,
      );
    }

    return await this.municipalityRepository.findOne({
      where: { id },
      relations: ['department'],
    });
  }

  async findByDepartment(departmentId: number): Promise<Municipality[]> {
    if (this.cacheService) {
      return await this.cacheService.get(
        `municipalities:dept:${departmentId}`,
        () =>
          this.municipalityRepository.find({
            where: { departmentId },
            relations: ['department'],
          }),
        3600,
      );
    }

    return await this.municipalityRepository.find({
      where: { departmentId },
      relations: ['department'],
    });
  }

  async update(
    id: number,
    updateMunicipalityDto: UpdateMunicipalityDto,
  ): Promise<Municipality | null> {
    const existing = await this.findOne(id);
    await this.municipalityRepository.update(id, updateMunicipalityDto);

    if (this.cacheService) {
      await this.cacheService.invalidate(`municipality:${id}`);
      await this.cacheService.invalidate('municipalities:all');
      if (existing?.departmentId) {
        await this.cacheService.invalidate(
          `municipalities:dept:${existing.departmentId}`,
        );
      }
    }

    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.findOne(id);
    await this.municipalityRepository.delete(id);

    if (this.cacheService) {
      await this.cacheService.invalidate(`municipality:${id}`);
      await this.cacheService.invalidate('municipalities:all');
      if (existing?.departmentId) {
        await this.cacheService.invalidate(
          `municipalities:dept:${existing.departmentId}`,
        );
      }
    }
  }
}
