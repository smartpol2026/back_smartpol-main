import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leader } from '../../database/entities/leader.entity';
import { Candidate } from '../../database/entities/candidate.entity';
import { User } from '../../database/entities/user.entity';
import { Campaign } from '../../database/entities/campaigns.entity';
import { CreateLeaderDto } from './dto/create-leader.dto';
import { UpdateLeaderDto } from './dto/update-leader.dto';
import { UserService } from '../users/user.service';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class LeaderService {
  constructor(
    @InjectRepository(Leader)
    private readonly leaderRepository: Repository<Leader>,
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly userService: UserService,
    @Optional()
    private readonly cacheService?: CacheService,
  ) {}

  async create(
    createLeaderDto: CreateLeaderDto,
    authenticatedUser?: any,
  ): Promise<Leader> {
    // ✅ NO necesitamos organizationId en el DTO
    // El organizationId viene del User a través del userId

    const leader = this.leaderRepository.create(createLeaderDto);
    const savedLeader = await this.leaderRepository.save(leader);

    if (authenticatedUser?.roleId === 3 && authenticatedUser?.id) {
      try {
        const candidate = await this.candidateRepository.findOne({
          where: { userId: authenticatedUser.id },
          relations: ['leaders'],
        });

        if (candidate) {
          if (!candidate.leaders) {
            candidate.leaders = [];
          }
          if (!candidate.leaders.some((l) => l.id === savedLeader.id)) {
            candidate.leaders.push(savedLeader);
            await this.candidateRepository.save(candidate);
          }
        }
      } catch (err) {
        console.error('Error assigning leader to candidate:', err);
      }
    }

    return (await this.findOne(savedLeader.id)) || savedLeader;
  }

  async findAll(): Promise<Leader[]> {
    if (this.cacheService) {
      return await this.cacheService.get(
        'leaders:all',
        () =>
          this.leaderRepository.find({
            relations: ['campaign', 'candidates', 'user'],
          }),
        1800,
      );
    }
    return await this.leaderRepository.find({
      relations: ['campaign', 'candidates', 'user'],
    });
  }

  async findAllWithPagination(
    page: number = 1,
    limit: number = 10,
    search?: string,
    organizationId?: number,
  ): Promise<{
    data: Leader[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;
    const query = this.leaderRepository
      .createQueryBuilder('leader')
      .leftJoinAndSelect('leader.campaign', 'campaign')
      .leftJoinAndSelect('leader.user', 'user');

    // Filter by organization through campaign
    if (organizationId) {
      query.andWhere('campaign.organizationId = :organizationId', {
        organizationId,
      });
    }

    if (search && search.trim()) {
      query.andWhere(
        `(LOWER(leader.name) LIKE LOWER(:search) OR LOWER(leader.document) LIKE LOWER(:search) OR LOWER(leader.municipality) LIKE LOWER(:search))`,
        { search: `%${search}%` },
      );
    }

    const [leaders, total] = await query
      .orderBy('leader.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: leaders,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findByCampaignId(campaignId: number): Promise<Leader[]> {
    if (!campaignId || isNaN(campaignId) || campaignId <= 0) {
      throw new BadRequestException(
        'campaignId debe ser un número positivo válido',
      );
    }

    if (this.cacheService) {
      return await this.cacheService.get(
        `leaders:campaign:${campaignId}`,
        () =>
          this.leaderRepository.find({
            where: { campaignId },
            relations: ['campaign', 'candidates', 'user'],
            order: { createdAt: 'DESC' },
          }),
        1800,
      );
    }

    return await this.leaderRepository.find({
      where: { campaignId },
      relations: ['campaign', 'candidates', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCandidateWithPagination(
    candidateId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{
    data: Leader[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    if (!candidateId || isNaN(candidateId) || candidateId <= 0) {
      throw new BadRequestException(
        'candidateId debe ser un número positivo válido',
      );
    }

    const skip = (page - 1) * limit;
    const query = this.leaderRepository
      .createQueryBuilder('leader')
      .leftJoinAndSelect('leader.campaign', 'campaign')
      .leftJoinAndSelect('leader.user', 'user')
      .innerJoin('candidate_leader', 'cl', 'cl.leader_id = leader.id')
      .where('cl.candidate_id = :candidateId', { candidateId });

    if (search && search.trim()) {
      query.andWhere(
        `(LOWER(leader.name) LIKE LOWER(:search) OR LOWER(leader.document) LIKE LOWER(:search) OR LOWER(leader.municipality) LIKE LOWER(:search))`,
        { search: `%${search}%` },
      );
    }

    const [leaders, total] = await query
      .orderBy('leader.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .distinct(true)
      .getManyAndCount();

    return {
      data: leaders,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Leader | null> {
    if (this.cacheService) {
      return await this.cacheService.get(
        `leader:${id}`,
        () =>
          this.leaderRepository.findOne({
            where: { id },
            relations: ['campaign', 'candidates', 'user'],
          }),
        1800,
      );
    }
    return await this.leaderRepository.findOne({
      where: { id },
      relations: ['campaign', 'candidates', 'user'],
    });
  }

  async findByUserId(userId: number): Promise<Leader | null> {
    if (this.cacheService) {
      return await this.cacheService.get(
        `leader:user:${userId}`,
        () =>
          this.leaderRepository.findOne({
            where: { userId },
            relations: ['campaign', 'candidates', 'user'],
          }),
        1800,
      );
    }
    return await this.leaderRepository.findOne({
      where: { userId },
      relations: ['campaign', 'candidates', 'user'],
    });
  }

  async update(
    id: number,
    updateLeaderDto: UpdateLeaderDto,
  ): Promise<Leader | null> {
    const leader = await this.leaderRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!leader) {
      throw new NotFoundException(`Leader with ID ${id} not found`);
    }

    const { password, ...updateData } = updateLeaderDto;

    // Actualizar el usuario si existe y se proporciona contraseña
    if (password && leader.userId) {
      await this.userService.update(leader.userId, { password });
    }

    await this.leaderRepository.update(id, updateData);

    if (this.cacheService) {
      await this.cacheService.invalidate(`leader:${id}`);
      await this.cacheService.invalidate('leaders:all');
      if (leader.campaignId) {
        await this.cacheService.invalidate(
          `leaders:campaign:${leader.campaignId}`,
        );
      }
      if (leader.userId) {
        await this.cacheService.invalidate(`leader:user:${leader.userId}`);
      }
    }

    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const leader = await this.leaderRepository.findOne({
      where: { id },
      relations: ['candidates', 'user'],
    });

    if (leader) {
      if (this.cacheService) {
        await this.cacheService.invalidate(`leader:${id}`);
        await this.cacheService.invalidate('leaders:all');
        if (leader.campaignId) {
          await this.cacheService.invalidate(
            `leaders:campaign:${leader.campaignId}`,
          );
        }
        if (leader.userId) {
          await this.cacheService.invalidate(`leader:user:${leader.userId}`);
        }
      }

      if (leader.userId) {
        // ✅ Al eliminar el usuario, se pierden todos sus datos incluyendo organizationId
        await this.userRepository.delete(leader.userId);
      }
      await this.leaderRepository.remove(leader);
    }
  }

  async getCandidates(leaderId: number): Promise<Candidate[]> {
    const leader = await this.leaderRepository.findOne({
      where: { id: leaderId },
      relations: ['candidates', 'candidates.corporation', 'campaign'],
    });

    if (!leader) {
      return [];
    }

    return leader.candidates;
  }

  async assignCandidates(
    leaderId: number,
    candidateIds: number[],
  ): Promise<Leader> {
    const leader = await this.leaderRepository.findOne({
      where: { id: leaderId },
      relations: ['candidates', 'campaign', 'user'],
    });

    if (!leader) {
      throw new NotFoundException(`Leader with ID ${leaderId} not found`);
    }

    const candidates = await this.candidateRepository.findByIds(candidateIds);
    leader.candidates = candidates;

    return await this.leaderRepository.save(leader);
  }

  async addCandidates(
    leaderId: number,
    candidateIds: number[],
  ): Promise<Leader> {
    const leader = await this.leaderRepository.findOne({
      where: { id: leaderId },
      relations: ['candidates', 'campaign', 'user'],
    });

    if (!leader) {
      throw new NotFoundException(`Leader with ID ${leaderId} not found`);
    }

    const candidates = await this.candidateRepository.findByIds(candidateIds);
    leader.candidates = [...(leader.candidates || []), ...candidates];

    return await this.leaderRepository.save(leader);
  }

  async removeCandidates(
    leaderId: number,
    candidateIds: number[],
  ): Promise<Leader> {
    const leader = await this.leaderRepository.findOne({
      where: { id: leaderId },
      relations: ['candidates', 'campaign', 'user'],
    });

    if (!leader) {
      throw new NotFoundException(`Leader with ID ${leaderId} not found`);
    }

    leader.candidates = (leader.candidates || []).filter(
      (c) => !candidateIds.includes(c.id),
    );

    return await this.leaderRepository.save(leader);
  }
}
