import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Candidate } from '../../database/entities/candidate.entity';
import { Leader } from '../../database/entities/leader.entity';
import { User } from '../../database/entities/user.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { Campaign } from 'src/database/entities';
import { UserService } from '../users/user.service';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(Leader)
    private readonly leaderRepository: Repository<Leader>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly userService: UserService,
    @Optional()
    private readonly cacheService?: CacheService,
  ) {}

  async create(
    createCandidateDto: CreateCandidateDto,
    authUserId: number,
  ): Promise<Candidate> {
    const { userId, campaignId, ...candidateData } = createCandidateDto;

    // 1. Obtener el usuario autenticado
    const authUser = await this.userRepository.findOne({
      where: { id: authUserId },
    });

    if (!authUser) {
      throw new ForbiddenException('Authenticated user not found');
    }

    // Determinar la organizationId para validación: usar la del usuario si existe, si no, será la de la campaña
    let operationOrganizationId = authUser.organizationId;

    // 2. Validar que el usuario candidato existe
    if (userId) {
      const candidateUser = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!candidateUser) {
        throw new BadRequestException(`User with ID ${userId} not found`);
      }
    }

    // 3. Si existe campaignId, validar que pertenece a la organizationId disponible
    if (campaignId) {
      const campaign = await this.campaignRepository.findOne({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new BadRequestException(
          `Campaign with ID ${campaignId} not found`,
        );
      }

      // Si el usuario autenticado tiene organizationId, validar que la campaña les pertenezca
      if (authUser.organizationId) {
        if (campaign.organizationId !== authUser.organizationId) {
          throw new ForbiddenException(
            `Campaign ${campaignId} does not belong to your organization`,
          );
        }
      } else {
        // Si es superadmin sin organizationId asignada, usar la de la campaña
        operationOrganizationId = campaign.organizationId;
      }
    } else {
      // Si no hay campaignId pero el usuario tampoco tiene organizationId, no puede crear candidato
      if (!authUser.organizationId) {
        throw new BadRequestException(
          'Either provide a campaignId or belong to an organization',
        );
      }
    }

    // 4. Crear el candidato asociado al usuario y campaña
    const candidate = this.candidateRepository.create({
      ...candidateData,
      userId,
      campaignId,
    });
    const savedCandidate = await this.candidateRepository.save(candidate);

    // Invalidar cache
    if (this.cacheService) {
      await this.cacheService.invalidate('candidates:all');
      if (userId) {
        await this.cacheService.invalidate(`candidate:user:${userId}`);
      }
      if (campaignId) {
        await this.cacheService.invalidate(`candidates:campaign:${campaignId}`);
      }
    }

    // Retornar el candidato encontrado, garantizando que existe
    const foundCandidate = await this.findOne(savedCandidate.id);

    if (!foundCandidate) {
      throw new BadRequestException('Failed to retrieve the created candidate');
    }

    return foundCandidate;
  }

  async findAll(): Promise<Candidate[]> {
    if (this.cacheService) {
      return await this.cacheService.get(
        'candidates:all',
        () =>
          this.candidateRepository.find({
            relations: ['corporation', 'campaign', 'user'],
          }),
        1800, // 30 minutos
      );
    }
    return await this.candidateRepository.find({
      relations: ['corporation', 'campaign', 'user'],
    });
  }

  async findAllWithPagination(
    page: number = 1,
    limit: number = 10,
    search?: string,
    organizationId?: number,
  ): Promise<{
    data: Candidate[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;
    const query = this.candidateRepository
      .createQueryBuilder('candidate')
      .leftJoinAndSelect('candidate.corporation', 'corporation')
      .leftJoinAndSelect('candidate.campaign', 'campaign')
      .leftJoinAndSelect('candidate.user', 'user');

    // Filter by organization through campaign
    if (organizationId) {
      query.andWhere('campaign.organizationId = :organizationId', {
        organizationId,
      });
    }

    if (search && search.trim()) {
      const searchCondition = `(
        LOWER(candidate.name) LIKE LOWER(:search)
        OR LOWER(candidate.party) LIKE LOWER(:search)
        OR CAST(candidate.number AS CHAR) LIKE :searchNumber
      )`;

      query.andWhere(searchCondition, {
        search: `%${search}%`,
        searchNumber: `%${search}%`,
      });
    }

    const [candidates, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: candidates,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Candidate | null> {
    if (this.cacheService) {
      return await this.cacheService.get(
        `candidate:${id}`,
        () =>
          this.candidateRepository.findOne({
            where: { id },
            relations: ['corporation', 'leaders', 'campaign', 'user'],
          }),
        1800,
      );
    }
    return await this.candidateRepository.findOne({
      where: { id },
      relations: ['corporation', 'leaders', 'campaign', 'user'],
    });
  }

  async findByUserId(userId: number): Promise<Candidate | null> {
    if (this.cacheService) {
      return await this.cacheService.get(
        `candidate:user:${userId}`,
        () =>
          this.candidateRepository.findOne({
            where: { userId },
            relations: ['corporation', 'leaders', 'campaign', 'user'],
          }),
        1800,
      );
    }
    return await this.candidateRepository.findOne({
      where: { userId },
      relations: ['corporation', 'leaders', 'campaign', 'user'],
    });
  }

  async findByCampaignIds(campaignIds: number[]): Promise<Candidate[]> {
    if (this.cacheService) {
      const cacheKey = `candidates:campaign:${campaignIds.join(',')}`;
      return await this.cacheService.get(
        cacheKey,
        () =>
          this.candidateRepository.find({
            where: { campaignId: In(campaignIds) },
            relations: ['corporation', 'leaders', 'campaign', 'user'],
          }),
        1800,
      );
    }
    return await this.candidateRepository.find({
      where: { campaignId: In(campaignIds) },
      relations: ['corporation', 'leaders', 'campaign', 'user'],
    });
  }

  async update(
    id: number,
    updateCandidateDto: UpdateCandidateDto,
  ): Promise<Candidate | null> {
    const candidate = await this.candidateRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }

    const { campaignId, password, ...updateData } = updateCandidateDto;

    // Validar cambio de campaña si se proporciona
    if (campaignId && candidate.user) {
      const campaign = await this.campaignRepository.findOne({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new BadRequestException(
          `Campaign with ID ${campaignId} not found`,
        );
      }

      // Validar que la campaña pertenece a la organización del usuario candidato
      if (campaign.organizationId !== candidate.user.organizationId) {
        throw new BadRequestException(
          `Campaign ${campaignId} does not belong to candidate's organization`,
        );
      }
    }

    // Actualizar el usuario si existe y se proporciona contraseña
    if (password && candidate.userId) {
      await this.userService.update(candidate.userId, { password });
    }

    await this.candidateRepository.update(id, {
      ...updateData,
      ...(campaignId && { campaignId }),
    });

    // Invalidar cache
    if (this.cacheService) {
      await this.cacheService.invalidate(`candidate:${id}`);
      await this.cacheService.invalidate('candidates:all');
      if (candidate.userId) {
        await this.cacheService.invalidate(
          `candidate:user:${candidate.userId}`,
        );
      }
      if (candidate.campaignId) {
        await this.cacheService.invalidate(
          `candidates:campaign:${candidate.campaignId}`,
        );
      }
      if (campaignId && campaignId !== candidate.campaignId) {
        await this.cacheService.invalidate(`candidates:campaign:${campaignId}`);
      }
    }

    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const candidate = await this.candidateRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (candidate) {
      // Invalidar cache antes de eliminar
      if (this.cacheService) {
        await this.cacheService.invalidate(`candidate:${id}`);
        await this.cacheService.invalidate('candidates:all');
        if (candidate.userId) {
          await this.cacheService.invalidate(
            `candidate:user:${candidate.userId}`,
          );
        }
        if (candidate.campaignId) {
          await this.cacheService.invalidate(
            `candidates:campaign:${candidate.campaignId}`,
          );
        }
      }

      if (candidate.userId) {
        await this.userRepository.delete(candidate.userId);
      }

      await this.candidateRepository.remove(candidate);
    }
  }

  async assignLeaderToCandidate(
    candidateId: number,
    leaderId: number,
  ): Promise<Candidate> {
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId },
      relations: ['leaders'],
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    const leader = await this.leaderRepository.findOne({
      where: { id: leaderId },
    });

    if (!leader) {
      throw new NotFoundException(`Leader with ID ${leaderId} not found`);
    }

    if (!candidate.leaders.some((l) => l.id === leaderId)) {
      candidate.leaders.push(leader);
      await this.candidateRepository.save(candidate);
    }

    return candidate;
  }

  async removeLeaderFromCandidate(
    candidateId: number,
    leaderId: number,
  ): Promise<Candidate> {
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId },
      relations: ['leaders'],
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    candidate.leaders = candidate.leaders.filter((l) => l.id !== leaderId);
    await this.candidateRepository.save(candidate);

    return candidate;
  }

  async getLeadersByCandidate(candidateId: number): Promise<Leader[]> {
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId },
      relations: ['leaders'],
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    return candidate.leaders;
  }

  /**
   * Obtener conteo de votantes por candidato de una organización
   */
  async getVoterCountByCandidate(organizationId?: number): Promise<
    Array<{
      candidateId: number;
      candidateName: string;
      voterCount: number;
    }>
  > {
    const query = this.candidateRepository
      .createQueryBuilder('candidate')
      .leftJoinAndSelect('candidate.campaign', 'campaign')
      .leftJoin('candidate_voter', 'cv', 'cv.candidate_id = candidate.id')
      .select('candidate.id', 'candidateId')
      .addSelect('candidate.name', 'candidateName')
      .addSelect('COUNT(DISTINCT cv.voter_id)', 'voterCount')
      .groupBy('candidate.id')
      .addGroupBy('candidate.name')
      .orderBy('COUNT(DISTINCT cv.voter_id)', 'DESC');

    // Filtrar por organización si se proporciona
    if (organizationId) {
      query.where('campaign.organizationId = :organizationId', {
        organizationId,
      });
    }

    const results = await query.getRawMany();

    return results.map((row) => ({
      candidateId: parseInt(row.candidateId),
      candidateName: row.candidateName,
      voterCount: parseInt(row.voterCount),
    }));
  }

  /**
   * Obtener conteo de votantes por partido de una organización
   */
  async getVoterCountByParty(organizationId?: number): Promise<
    Array<{
      party: string;
      voterCount: number;
    }>
  > {
    const query = this.candidateRepository
      .createQueryBuilder('candidate')
      .leftJoinAndSelect('candidate.campaign', 'campaign')
      .leftJoin('candidate_voter', 'cv', 'cv.candidate_id = candidate.id')
      .select('candidate.party', 'party')
      .addSelect('COUNT(DISTINCT cv.voter_id)', 'voterCount')
      .groupBy('candidate.party')
      .orderBy('COUNT(DISTINCT cv.voter_id)', 'DESC');

    // Filtrar por organización si se proporciona
    if (organizationId) {
      query.where('campaign.organizationId = :organizationId', {
        organizationId,
      });
    }

    const results = await query.getRawMany();

    return results
      .filter((row) => row.party) // Excluir registros sin partido
      .map((row) => ({
        party: row.party,
        voterCount: parseInt(row.voterCount),
      }));
  }

  async findByLeaderAndCorporation(
    leaderId: number,
    corporationId: number,
  ): Promise<Candidate[]> {
    return await this.candidateRepository
      .createQueryBuilder('candidate')
      .innerJoinAndSelect(
        'candidate.leaders',
        'leader',
        'leader.id = :leaderId',
        { leaderId },
      )
      .innerJoinAndSelect('candidate.corporation', 'corporation')
      .leftJoinAndSelect('candidate.campaign', 'campaign')
      .leftJoinAndSelect('candidate.user', 'user')
      .where('candidate.corporation_id = :corporationId', { corporationId })
      .setParameter('leaderId', leaderId)
      .setParameter('corporationId', corporationId)
      .getMany();
  }
}
