import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../../database/entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @Optional()
    private readonly cacheService?: CacheService,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const department = this.departmentRepository.create(createDepartmentDto);
    const result = await this.departmentRepository.save(department);

    if (this.cacheService) {
      await this.cacheService.invalidate('departments:all');
    }

    return result;
  }

  async findAll(): Promise<Department[]> {
    if (this.cacheService) {
      return await this.cacheService.get(
        'departments:all',
        () => this.departmentRepository.find({ relations: ['municipalities'] }),
        3600, // 1 hora
      );
    }

    return await this.departmentRepository.find({
      relations: ['municipalities'],
    });
  }

  async findOne(id: number): Promise<Department | null> {
    if (this.cacheService) {
      return await this.cacheService.get(
        `department:${id}`,
        () =>
          this.departmentRepository.findOne({
            where: { id },
            relations: ['municipalities'],
          }),
        3600,
      );
    }

    return await this.departmentRepository.findOne({
      where: { id },
      relations: ['municipalities'],
    });
  }

  async update(
    id: number,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department | null> {
    await this.departmentRepository.update(id, updateDepartmentDto);

    if (this.cacheService) {
      await this.cacheService.invalidate(`department:${id}`);
      await this.cacheService.invalidate('departments:all');
    }

    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.departmentRepository.delete(id);

    if (this.cacheService) {
      await this.cacheService.invalidate(`department:${id}`);
      await this.cacheService.invalidate('departments:all');
    }
  }
}
