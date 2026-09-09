import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VotingTable } from '../../database/entities/voting-table.entity';
import { CreateVotingTableDto } from './dto/create-voting-table.dto';
import { UpdateVotingTableDto } from './dto/update-voting-table.dto';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class VotingTableService {
  constructor(
    @InjectRepository(VotingTable)
    private votingTableRepository: Repository<VotingTable>,
    @Optional()
    private readonly cacheService?: CacheService,
  ) {}

  async create(createVotingTableDto: CreateVotingTableDto) {
    const votingTable = this.votingTableRepository.create(createVotingTableDto);
    const result = await this.votingTableRepository.save(votingTable);

    if (this.cacheService) {
      await this.cacheService.invalidate('votingtables:all');
      if (result.votingBoothId) {
        await this.cacheService.invalidate(
          `votingtables:booth:${result.votingBoothId}`,
        );
      }
    }

    return result;
  }

  async findAll() {
    if (this.cacheService) {
      return await this.cacheService.get(
        'votingtables:all',
        () =>
          this.votingTableRepository.find({
            relations: ['votingBooth'],
            order: { tableNumber: 'ASC' },
          }),
        1800,
      );
    }

    return await this.votingTableRepository.find({
      relations: ['votingBooth'],
      order: { tableNumber: 'ASC' },
    });
  }

  async findByVotingBooth(votingBoothId: number) {
    if (this.cacheService) {
      return await this.cacheService.get(
        `votingtables:booth:${votingBoothId}`,
        () =>
          this.votingTableRepository.find({
            where: { votingBoothId },
            relations: ['votingBooth'],
            order: { tableNumber: 'ASC' },
          }),
        1800,
      );
    }

    return await this.votingTableRepository.find({
      where: { votingBoothId },
      relations: ['votingBooth'],
      order: { tableNumber: 'ASC' },
    });
  }

  async findOne(id: number) {
    if (this.cacheService) {
      const votingTable = await this.cacheService.get(
        `votingtable:${id}`,
        () =>
          this.votingTableRepository.findOne({
            where: { id },
            relations: ['votingBooth'],
          }),
        1800,
      );

      if (!votingTable) {
        throw new NotFoundException(
          `Mesa de votación con ID ${id} no encontrada`,
        );
      }

      return votingTable;
    }

    const votingTable = await this.votingTableRepository.findOne({
      where: { id },
      relations: ['votingBooth'],
    });

    if (!votingTable) {
      throw new NotFoundException(
        `Mesa de votación con ID ${id} no encontrada`,
      );
    }

    return votingTable;
  }

  async update(id: number, updateVotingTableDto: UpdateVotingTableDto) {
    const votingTable = await this.findOne(id);
    Object.assign(votingTable, updateVotingTableDto);
    const result = await this.votingTableRepository.save(votingTable);

    if (this.cacheService) {
      await this.cacheService.invalidate(`votingtable:${id}`);
      await this.cacheService.invalidate('votingtables:all');
      if (votingTable.votingBoothId) {
        await this.cacheService.invalidate(
          `votingtables:booth:${votingTable.votingBoothId}`,
        );
      }
    }

    return result;
  }

  async remove(id: number) {
    const votingTable = await this.findOne(id);

    if (this.cacheService) {
      await this.cacheService.invalidate(`votingtable:${id}`);
      await this.cacheService.invalidate('votingtables:all');
      if (votingTable.votingBoothId) {
        await this.cacheService.invalidate(
          `votingtables:booth:${votingTable.votingBoothId}`,
        );
      }
    }

    return await this.votingTableRepository.remove(votingTable);
  }
}
