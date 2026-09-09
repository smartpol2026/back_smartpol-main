import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VotingBooth } from '../../database/entities/voting-booth.entity';
import { CreateVotingBoothDto } from './dto/create-voting-booth.dto';
import { UpdateVotingBoothDto } from './dto/update-voting-booth.dto';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class VotingBoothService {
  constructor(
    @InjectRepository(VotingBooth)
    private votingBoothRepository: Repository<VotingBooth>,
    @Optional()
    private readonly cacheService?: CacheService,
  ) {}

  async create(createVotingBoothDto: CreateVotingBoothDto) {
    const votingBooth = this.votingBoothRepository.create(createVotingBoothDto);
    const result = await this.votingBoothRepository.save(votingBooth);

    if (this.cacheService) {
      await this.cacheService.invalidate('votingbooths:all');
      if (result.municipalityId) {
        await this.cacheService.invalidate(
          `votingbooths:municipality:${result.municipalityId}`,
        );
      }
    }

    return result;
  }

  async findAll() {
    if (this.cacheService) {
      return await this.cacheService.get(
        'votingbooths:all',
        () =>
          this.votingBoothRepository.find({
            relations: ['municipality'],
            order: { name: 'ASC' },
          }),
        1800,
      );
    }

    return await this.votingBoothRepository.find({
      relations: ['municipality'],
      order: { name: 'ASC' },
    });
  }

  async findByMunicipality(municipalityId: number) {
    if (this.cacheService) {
      return await this.cacheService.get(
        `votingbooths:municipality:${municipalityId}`,
        () =>
          this.votingBoothRepository.find({
            where: { municipalityId },
            relations: ['municipality'],
            order: { name: 'ASC' },
          }),
        1800,
      );
    }

    return await this.votingBoothRepository.find({
      where: { municipalityId },
      relations: ['municipality'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number) {
    if (this.cacheService) {
      const votingBooth = await this.cacheService.get(
        `votingbooth:${id}`,
        () =>
          this.votingBoothRepository.findOne({
            where: { id },
            relations: ['municipality'],
          }),
        1800,
      );

      if (!votingBooth) {
        throw new NotFoundException(
          `Puesto de votación con ID ${id} no encontrado`,
        );
      }

      return votingBooth;
    }

    const votingBooth = await this.votingBoothRepository.findOne({
      where: { id },
      relations: ['municipality'],
    });

    if (!votingBooth) {
      throw new NotFoundException(
        `Puesto de votación con ID ${id} no encontrado`,
      );
    }

    return votingBooth;
  }

  async update(id: number, updateVotingBoothDto: UpdateVotingBoothDto) {
    const votingBooth = await this.findOne(id);
    Object.assign(votingBooth, updateVotingBoothDto);
    const result = await this.votingBoothRepository.save(votingBooth);

    if (this.cacheService) {
      await this.cacheService.invalidate(`votingbooth:${id}`);
      await this.cacheService.invalidate('votingbooths:all');
      if (votingBooth.municipalityId) {
        await this.cacheService.invalidate(
          `votingbooths:municipality:${votingBooth.municipalityId}`,
        );
      }
    }

    return result;
  }

  async remove(id: number) {
    const votingBooth = await this.findOne(id);

    if (this.cacheService) {
      await this.cacheService.invalidate(`votingbooth:${id}`);
      await this.cacheService.invalidate('votingbooths:all');
      if (votingBooth.municipalityId) {
        await this.cacheService.invalidate(
          `votingbooths:municipality:${votingBooth.municipalityId}`,
        );
      }
    }

    return await this.votingBoothRepository.remove(votingBooth);
  }
}
