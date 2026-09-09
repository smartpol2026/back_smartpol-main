import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { Voter } from '../../database/entities/voter.entity';
import { Candidate } from '../../database/entities/candidate.entity';
import { Leader } from '../../database/entities/leader.entity';
import { CandidateVoter } from '../../database/entities/candidate-voter.entity';
import { Department } from '../../database/entities/department.entity';
import { Municipality } from '../../database/entities/municipality.entity';
import { VotingBooth } from '../../database/entities/voting-booth.entity';
import { VotersHistory } from '../../database/entities/voters-history.entity';
import { Divipol } from '../../database/entities/divipol.entity';
import { CreateVoterDto } from './dto/create-voter.dto';
import { UpdateVoterDto } from './dto/update-voter.dto';
import { AssignCandidateDto } from './dto/assign-candidate.dto';
import { VoterReportFilterDto, VoterReportDto } from './dto/voter-report.dto';
import { VoterSearchByIdentificationDto } from './dto/voter-search-identification.dto';
import {
  PaginationQueryDto,
  PaginatedResponseDto,
} from './dto/pagination-query.dto';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class VoterService {
  constructor(
    @InjectRepository(Voter)
    private readonly voterRepository: Repository<Voter>,
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(Leader)
    private readonly leaderRepository: Repository<Leader>,
    @InjectRepository(CandidateVoter)
    private readonly candidateVoterRepository: Repository<CandidateVoter>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Municipality)
    private readonly municipalityRepository: Repository<Municipality>,
    @InjectRepository(VotingBooth)
    private readonly votingBoothRepository: Repository<VotingBooth>,
    @InjectRepository(VotersHistory)
    private readonly votersHistoryRepository: Repository<VotersHistory>,
    @InjectRepository(Divipol)
    private readonly divipolRepository: Repository<Divipol>,
    @Optional()
    private readonly cacheService?: CacheService,
  ) {}

  async create(
    createVoterDto: CreateVoterDto,
    createdByUserId?: number,
    organizationId?: number,
  ): Promise<Voter> {
    // Validar que no existe votante con la misma identificación en la misma organización
    if (organizationId) {
      const existingVoter = await this.candidateVoterRepository
        .createQueryBuilder('cv')
        .leftJoinAndSelect('cv.voter', 'voter')
        .leftJoinAndSelect('cv.candidate', 'candidate')
        .leftJoinAndSelect('candidate.campaign', 'campaign')
        .where('voter.identification = :identification', {
          identification: createVoterDto.identification,
        })
        .andWhere('campaign.organizationId = :organizationId', {
          organizationId,
        })
        .getOne();

      if (existingVoter) {
        throw new BadRequestException(
          `Ya existe un votante con la identificación ${createVoterDto.identification} en tu organización. ${existingVoter.voter.firstName} ${existingVoter.voter.lastName}`,
        );
      }
    }

    // Validar que el departamento existe
    if (createVoterDto.departmentId) {
      const department = await this.departmentRepository.findOneBy({
        id: createVoterDto.departmentId,
      });
      if (!department) {
        throw new BadRequestException(
          `Departamento con ID ${createVoterDto.departmentId} no encontrado`,
        );
      }
    }

    // Validar que el municipio existe
    if (createVoterDto.municipalityId) {
      const municipality = await this.municipalityRepository.findOneBy({
        id: createVoterDto.municipalityId,
      });
      if (!municipality) {
        throw new BadRequestException(
          `Municipio con ID ${createVoterDto.municipalityId} no encontrado`,
        );
      }
    }

    // Validar que el puesto de votación existe si se actualiza
    if (createVoterDto.votingBoothId) {
      const votingBooth = await this.votingBoothRepository.findOneBy({
        id: createVoterDto.votingBoothId,
      });
      if (!votingBooth) {
        throw new BadRequestException(
          `Puesto de votación con ID ${createVoterDto.votingBoothId} no encontrado`,
        );
      }
    }

    const voter = this.voterRepository.create({
      ...createVoterDto,
      createdByUserId,
    });
    const saved = await this.voterRepository.save(voter);

    // 🔥 Invalidar cache cuando se crea nuevo votante
    if (this.cacheService) {
      try {
        await this.cacheService.invalidateByPattern('voters:list:*');
        await this.cacheService.invalidate('voters:all');
      } catch (err) {
        // Continuar si falla invalidación
      }
    }

    return saved;
  }

  async findAll(): Promise<Voter[]> {
    if (this.cacheService) {
      return await this.cacheService.get(
        'voters:all',
        () =>
          this.voterRepository.find({
            relations: ['department', 'municipality', 'votingBooth'],
          }),
        600,
      );
    }
    return await this.voterRepository.find({
      relations: ['department', 'municipality', 'votingBooth'],
    });
  }

  async findAllPaginated(
    paginationQueryDto: PaginationQueryDto,
    user?: any,
  ): Promise<PaginatedResponseDto<Voter>> {
    // Si no hay cacheService disponible, ejecutar sin caché
    if (!this.cacheService) {
      return this.executeVotersListQuery(paginationQueryDto, user);
    }

    // Generar cache key basado en paginación y organización
    const cacheKey = this.generateVotersListCacheKey(paginationQueryDto, user);

    // Usar CacheService con patrón: get(key, fn, ttl)
    return await this.cacheService.get(
      cacheKey,
      () => this.executeVotersListQuery(paginationQueryDto, user),
      600, // TTL en segundos
    );
  }

  private generateVotersListCacheKey(
    paginationQueryDto: PaginationQueryDto,
    user?: any,
  ): string {
    const page = paginationQueryDto.page || 1;
    const limit = paginationQueryDto.limit || 20;
    const orgId = user?.organizationId || 'all';
    return `voters:list:org=${orgId}:page=${page}:limit=${limit}`;
  }

  private async executeVotersListQuery(
    paginationQueryDto: PaginationQueryDto,
    user?: any,
  ): Promise<PaginatedResponseDto<Voter>> {
    const { page = 1, limit = 20 } = paginationQueryDto;
    const skip = (page - 1) * limit;

    // Si es digitador o admin de campaña, filtrar por organización
    if (
      user &&
      (user.roleId === 2 || user.roleId === 5) &&
      user.organizationId
    ) {
      // 🔧 OPTIMIZACIÓN: Una sola query que consolida las 3 fuentes con UNION
      // Obtiene DISTINCT voter_id en una sola operación

      const voterIdQuery = `
        SELECT DISTINCT voter_id as id FROM (
          -- 1. Votantes asignados a candidatos en esta organización
          SELECT DISTINCT cv.voter_id 
          FROM candidate_voter cv
          INNER JOIN candidates c ON cv.candidate_id = c.id
          INNER JOIN campaigns cam ON c."campaignId" = cam.id
          WHERE cam."organizationId" = $1
          
          UNION ALL
          
          -- 2. Votantes asignados a líderes en esta organización
          SELECT DISTINCT cv.voter_id 
          FROM candidate_voter cv
          INNER JOIN leaders l ON cv.leader_id = l.id
          INNER JOIN campaigns cam ON l."campaignId" = cam.id
          WHERE cam."organizationId" = $1
          
          UNION ALL
          
          -- 3. Votantes creados por digitadores de esta organización
          SELECT DISTINCT v.id as voter_id
          FROM voters v
          INNER JOIN users u ON v."createdByUserId" = u.id
          WHERE u."organizationId" = $1
        ) unified_voters
        ORDER BY id
      `;

      // Obtener total de IDs únicos
      const totalResult = await this.voterRepository.query(
        `SELECT COUNT(DISTINCT id) as count FROM (${voterIdQuery}) AS counted`,
        [user.organizationId],
      );
      const total = parseInt(totalResult[0]?.count || '0');

      if (total === 0) {
        return {
          data: [],
          page,
          limit,
          total: 0,
          pages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      // Obtener los IDs paginados
      const paginatedIdResult = await this.voterRepository.query(
        `${voterIdQuery} LIMIT $2 OFFSET $3`,
        [user.organizationId, limit, skip],
      );
      const paginatedIds = paginatedIdResult.map((r) => r.id);

      if (paginatedIds.length === 0) {
        return {
          data: [],
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        };
      }

      // Cargar voters con sus relaciones básicas
      const voters = await this.voterRepository.find({
        where: { id: In(paginatedIds) },
        relations: ['department', 'municipality', 'votingBooth'],
      });

      // Cargar assignments (candidates y leaders) en una sola query
      const candidateVoters = await this.candidateVoterRepository.find({
        where: { voterId: In(paginatedIds) },
        relations: ['candidate', 'leader'],
      });

      // Mapear assignments
      const candidateMap = new Map();
      const leaderMap = new Map();

      candidateVoters.forEach((cv) => {
        if (!candidateMap.has(cv.voterId)) {
          candidateMap.set(cv.voterId, []);
        }
        if (cv.candidate) {
          candidateMap.get(cv.voterId).push(cv.candidate);
        }

        if (!leaderMap.has(cv.voterId)) {
          leaderMap.set(cv.voterId, []);
        }
        if (cv.leader) {
          leaderMap.get(cv.voterId).push(cv.leader);
        }
      });

      // Enriquecer voters
      voters.forEach((voter) => {
        voter.candidates = candidateMap.get(voter.id) || [];
        voter.leaders = leaderMap.get(voter.id) || [];
      });

      const pages = Math.ceil(total / limit);

      return {
        data: voters,
        page,
        limit,
        total,
        pages,
        hasNextPage: page < pages,
        hasPreviousPage: page > 1,
      };
    }

    // Para usuarios sin filtro organizacional, usar findAndCount directo
    const [voters, total] = await this.voterRepository.findAndCount({
      skip,
      take: limit,
      relations: ['department', 'municipality', 'votingBooth'],
    });

    // Cargar assignments
    const voterIds = voters.map((v) => v.id);
    if (voterIds.length > 0) {
      const candidateVoters = await this.candidateVoterRepository.find({
        where: { voterId: In(voterIds) },
        relations: ['candidate', 'leader'],
      });

      const candidateMap = new Map();
      const leaderMap = new Map();

      candidateVoters.forEach((cv) => {
        if (!candidateMap.has(cv.voterId)) {
          candidateMap.set(cv.voterId, []);
        }
        if (cv.candidate) {
          candidateMap.get(cv.voterId).push(cv.candidate);
        }

        if (!leaderMap.has(cv.voterId)) {
          leaderMap.set(cv.voterId, []);
        }
        if (cv.leader) {
          leaderMap.get(cv.voterId).push(cv.leader);
        }
      });

      voters.forEach((voter) => {
        voter.candidates = candidateMap.get(voter.id) || [];
        voter.leaders = leaderMap.get(voter.id) || [];
      });
    } else {
      voters.forEach((voter) => {
        voter.candidates = [];
        voter.leaders = [];
      });
    }

    const pages = Math.ceil(total / limit);
    const hasNextPage = page < pages;
    const hasPreviousPage = page > 1;

    return {
      data: voters,
      page,
      limit,
      total,
      pages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  async findOneWithAllRelations(id: number): Promise<Voter> {
    // Carga TODOS los datos necesarios para el modal de editar
    const voter = await this.voterRepository.findOne({
      where: { id },
      relations: ['department', 'municipality', 'votingBooth'],
    });

    if (!voter) {
      throw new NotFoundException(`Votante con ID ${id} no encontrado`);
    }

    // Traer candidatos_voter con líderes
    const candidateVoters = await this.candidateVoterRepository.find({
      where: { voterId: id },
      relations: ['candidate', 'leader'],
    });

    // Injetar líderes en el votante
    voter.leaders = candidateVoters
      .filter((cv) => cv.leader !== null && cv.leader !== undefined)
      .map((cv) => cv.leader as Leader);

    // Injetar candidatos en el votante
    voter.candidates = candidateVoters
      .map((cv) => cv.candidate)
      .filter(Boolean);

    return voter;
  }

  async findByCandidatePaginated(
    candidateId: number,
    paginationQueryDto: PaginationQueryDto,
    user?: any,
  ): Promise<PaginatedResponseDto<Voter>> {
    const { page = 1, limit = 20 } = paginationQueryDto;
    const skip = (page - 1) * limit;

    // If user is campaign admin (roleId=2), verify the candidate belongs to their organization
    if (user && user.roleId === 2 && user.organizationId) {
      const candidate = await this.candidateRepository.findOne({
        where: { id: candidateId },
        relations: ['campaign'],
      });

      if (
        !candidate ||
        !candidate.campaign ||
        candidate.campaign.organizationId !== user.organizationId
      ) {
        // Return empty result if candidate doesn't belong to user's organization
        return {
          data: [],
          page,
          limit,
          total: 0,
          pages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }
    }

    // Fetch voters for this candidate
    const candidateVoters = await this.candidateVoterRepository.find({
      where: { candidateId },
      select: ['voterId'],
    });

    const voterIds = candidateVoters.map((cv) => cv.voterId);

    // If no voters are assigned to this candidate, return empty result
    if (voterIds.length === 0) {
      return {
        data: [],
        page,
        limit,
        total: 0,
        pages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }

    const [voters, total] = await this.voterRepository.findAndCount({
      where: { id: In(voterIds) },
      skip,
      take: limit,
      relations: ['department', 'municipality', 'votingBooth'],
    });

    if (voters.length > 0) {
      const allCandidateVoters = await this.candidateVoterRepository.find({
        where: { voterId: In(voters.map((v) => v.id)) },
        relations: ['candidate', 'leader'],
      });

      const candidateMap = new Map();
      const leaderMap = new Map();

      allCandidateVoters.forEach((cv) => {
        if (!candidateMap.has(cv.voterId)) {
          candidateMap.set(cv.voterId, []);
        }
        if (cv.candidate) {
          candidateMap.get(cv.voterId).push(cv.candidate);
        }

        if (!leaderMap.has(cv.voterId)) {
          leaderMap.set(cv.voterId, []);
        }
        if (cv.leader) {
          leaderMap.get(cv.voterId).push(cv.leader);
        }
      });

      voters.forEach((voter) => {
        voter.candidates = candidateMap.get(voter.id) || [];
        voter.leaders = leaderMap.get(voter.id) || [];
      });
    } else {
      voters.forEach((voter) => {
        voter.candidates = [];
        voter.leaders = [];
      });
    }

    const pages = Math.ceil(total / limit);
    const hasNextPage = page < pages;
    const hasPreviousPage = page > 1;

    return {
      data: voters,
      page,
      limit,
      total,
      pages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  async findByLeaderPaginated(
    leaderId: number,
    paginationQueryDto: PaginationQueryDto,
    user?: any,
  ): Promise<PaginatedResponseDto<Voter>> {
    const { page = 1, limit = 20 } = paginationQueryDto;
    const skip = (page - 1) * limit;

    // If user is campaign admin (roleId=2), verify the leader belongs to their organization
    if (user && user.roleId === 2 && user.organizationId) {
      const leader = await this.leaderRepository.findOne({
        where: { id: leaderId },
        relations: ['campaign'],
      });

      if (
        !leader ||
        !leader.campaign ||
        leader.campaign.organizationId !== user.organizationId
      ) {
        // Return empty result if leader doesn't belong to user's organization
        return {
          data: [],
          page,
          limit,
          total: 0,
          pages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }
    }

    // Fetch voters for this leader
    const candidateVoters = await this.candidateVoterRepository.find({
      where: { leaderId },
      select: ['voterId'],
    });

    const voterIds = candidateVoters.map((cv) => cv.voterId);

    // If no voters are assigned to this leader, return empty result
    if (voterIds.length === 0) {
      return {
        data: [],
        page,
        limit,
        total: 0,
        pages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }

    const [voters, total] = await this.voterRepository.findAndCount({
      where: { id: In(voterIds) },
      skip,
      take: limit,
      relations: ['department', 'municipality', 'votingBooth'],
    });

    if (voters.length > 0) {
      const allCandidateVoters = await this.candidateVoterRepository.find({
        where: { voterId: In(voters.map((v) => v.id)) },
        relations: ['candidate', 'leader'],
      });

      const candidateMap = new Map();
      const leaderMap = new Map();

      allCandidateVoters.forEach((cv) => {
        if (!candidateMap.has(cv.voterId)) {
          candidateMap.set(cv.voterId, []);
        }
        if (cv.candidate) {
          candidateMap.get(cv.voterId).push(cv.candidate);
        }

        if (!leaderMap.has(cv.voterId)) {
          leaderMap.set(cv.voterId, []);
        }
        if (cv.leader) {
          leaderMap.get(cv.voterId).push(cv.leader);
        }
      });

      voters.forEach((voter) => {
        voter.candidates = candidateMap.get(voter.id) || [];
        voter.leaders = leaderMap.get(voter.id) || [];
      });
    } else {
      voters.forEach((voter) => {
        voter.candidates = [];
        voter.leaders = [];
      });
    }

    const pages = Math.ceil(total / limit);
    const hasNextPage = page < pages;
    const hasPreviousPage = page > 1;

    return {
      data: voters,
      page,
      limit,
      total,
      pages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  async findAllWithAssignmentsByRole(
    roleId?: number,
    candidateId?: number,
    leaderId?: number,
    user?: any,
  ): Promise<Voter[]> {
    // Fetch voters based on role
    let voters: Voter[] = [];

    if (roleId === 3 && candidateId) {
      // Candidato: traer solo sus votantes
      const candidateVoters = await this.candidateVoterRepository.find({
        where: { candidateId },
        select: ['voterId'],
      });
      const voterIds = candidateVoters.map((cv) => cv.voterId);
      if (voterIds.length > 0) {
        voters = await this.voterRepository.find({
          where: { id: In(voterIds) },
          relations: ['department', 'municipality', 'votingBooth'],
        });
      }
    } else if (roleId === 4 && leaderId) {
      // Líder: traer solo los votantes de sus candidatos
      const leaderCandidateVoters = await this.candidateVoterRepository.find({
        where: { leaderId },
        select: ['voterId'],
      });
      const voterIds = leaderCandidateVoters.map((cv) => cv.voterId);
      if (voterIds.length > 0) {
        voters = await this.voterRepository.find({
          where: { id: In(voterIds) },
          relations: ['department', 'municipality', 'votingBooth'],
        });
      }
    } else if (roleId === 2 && user && user.organizationId) {
      // Admin de campaña: traer votantes de su organización asociados a:
      // 1. Candidatos de su organización
      // 2. Líderes de su organización
      // 3. Digitadores de su organización

      // Get all campaigns for this organization
      const campaigns = await this.voterRepository.query(
        'SELECT id FROM campaigns WHERE "organizationId" = $1',
        [user.organizationId],
      );
      const campaignIds = campaigns.map((c) => c.id);

      // If campaigns exist, get voters from candidates and leaders
      if (campaignIds.length > 0) {
        // From candidates in these campaigns
        const candidateVoterResults = await this.voterRepository.query(
          `SELECT DISTINCT "voter_id" FROM candidate_voter WHERE "candidate_id" IN 
           (SELECT id FROM candidates WHERE "campaignId" IN (${campaignIds.join(',')}))`,
        );
        const candidateVoterIds = candidateVoterResults.map((r) => r.voter_id);

        // From leaders in these campaigns
        const leaderVoterResults = await this.voterRepository.query(
          `SELECT DISTINCT "voter_id" FROM candidate_voter WHERE "leader_id" IN 
           (SELECT id FROM leaders WHERE "campaignId" IN (${campaignIds.join(',')}))`,
        );
        const leaderVoterIds = leaderVoterResults.map((r) => r.voter_id);

        // From digitadores in this organization
        const digitadorVoterResults = await this.voterRepository.query(
          `SELECT DISTINCT id FROM voters WHERE "createdByUserId" IN 
           (SELECT id FROM users WHERE "organizationId" = $1)`,
          [user.organizationId],
        );
        const digitadorVoterIds = digitadorVoterResults.map((r) => r.id);

        // Combine and deduplicate
        const allVoterIds = [
          ...new Set([
            ...candidateVoterIds,
            ...leaderVoterIds,
            ...digitadorVoterIds,
          ]),
        ];

        if (allVoterIds.length > 0) {
          voters = await this.voterRepository.find({
            where: { id: In(allVoterIds) },
            relations: ['department', 'municipality', 'votingBooth'],
          });
        }
      }
    } else {
      // Otros roles: traer votantes de su organización si tienen organizationId
      const where: any = {};

      // Digitadores (roleId = 5): mostrar todos los votantes de su organización
      if (user && user.roleId === 5 && user.organizationId) {
        // Get all campaigns for this organization
        const campaigns = await this.voterRepository.query(
          'SELECT id FROM campaigns WHERE "organizationId" = $1',
          [user.organizationId],
        );
        const campaignIds = campaigns.map((c) => c.id);

        // If campaigns exist, get voters from candidates and leaders
        if (campaignIds.length > 0) {
          // From candidates in these campaigns
          const candidateVoterResults = await this.voterRepository.query(
            `SELECT DISTINCT "voter_id" FROM candidate_voter WHERE "candidate_id" IN 
             (SELECT id FROM candidates WHERE "campaignId" IN (${campaignIds.join(',')}))`,
          );
          const candidateVoterIds = candidateVoterResults.map(
            (r) => r.voter_id,
          );

          // From leaders in these campaigns
          const leaderVoterResults = await this.voterRepository.query(
            `SELECT DISTINCT "voter_id" FROM candidate_voter WHERE "leader_id" IN 
             (SELECT id FROM leaders WHERE "campaignId" IN (${campaignIds.join(',')}))`,
          );
          const leaderVoterIds = leaderVoterResults.map((r) => r.voter_id);

          // From digitadores in this organization
          const digitadorVoterResults = await this.voterRepository.query(
            `SELECT DISTINCT id FROM voters WHERE "createdByUserId" IN 
             (SELECT id FROM users WHERE "organizationId" = $1)`,
            [user.organizationId],
          );
          const digitadorVoterIds = digitadorVoterResults.map((r) => r.id);

          // Combine and deduplicate
          const allVoterIds = [
            ...new Set([
              ...candidateVoterIds,
              ...leaderVoterIds,
              ...digitadorVoterIds,
            ]),
          ];

          if (allVoterIds.length > 0) {
            where.id = In(allVoterIds);
          }
        }
      }

      voters = await this.voterRepository.find({
        where,
        relations: ['department', 'municipality', 'votingBooth'],
      });
    }

    // Traer asignaciones para todos los voters
    if (voters.length > 0) {
      const voterIds = voters.map((v) => v.id);
      const allCandidateVoters = await this.candidateVoterRepository.find({
        where: { voterId: In(voterIds) },
        relations: ['candidate', 'leader'],
      });

      const candidateMap = new Map();
      const leaderMap = new Map();

      allCandidateVoters.forEach((cv) => {
        if (!candidateMap.has(cv.voterId)) {
          candidateMap.set(cv.voterId, []);
        }
        if (cv.candidate) {
          candidateMap.get(cv.voterId).push(cv.candidate);
        }

        if (!leaderMap.has(cv.voterId)) {
          leaderMap.set(cv.voterId, []);
        }
        if (cv.leader) {
          leaderMap.get(cv.voterId).push(cv.leader);
        }
      });

      voters.forEach((voter) => {
        voter.candidates = candidateMap.get(voter.id) || [];
        voter.leaders = leaderMap.get(voter.id) || [];
      });
    } else {
      voters.forEach((voter) => {
        voter.candidates = [];
        voter.leaders = [];
      });
    }

    return voters;
  }

  async findOne(id: number): Promise<Voter> {
    if (this.cacheService) {
      return await this.cacheService.get(
        `voters:${id}`,
        () => this.executeFindOne(id),
        600,
      );
    }
    return await this.executeFindOne(id);
  }

  private async executeFindOne(id: number): Promise<Voter> {
    const voter = await this.voterRepository.findOne({
      where: { id },
    });

    if (!voter) {
      throw new NotFoundException(`Votante con ID ${id} no encontrado`);
    }

    return voter;
  }

  async findByIdentification(identification: string): Promise<Voter | null> {
    if (this.cacheService) {
      return await this.cacheService.get(
        `voters:identification:${identification}`,
        () =>
          this.voterRepository.findOne({
            where: { identification },
            select: ['id', 'identification', 'firstName', 'lastName'],
          }),
        600,
      );
    }
    const voter = await this.voterRepository.findOne({
      where: { identification },
      select: ['id', 'identification', 'firstName', 'lastName'],
    });

    return voter || null;
  }

  async update(
    id: number,
    updateVoterDto: UpdateVoterDto,
    organizationId?: number,
  ): Promise<Voter> {
    const voter = await this.voterRepository.findOneBy({ id });

    if (!voter) {
      throw new NotFoundException(`Votante con ID ${id} no encontrado`);
    }

    // Validaciones usando un objeto nombrado (no array desordenado)
    const validations: any = {
      existingIdentification: null,
      existingEmail: null,
      department: null,
      municipality: null,
      votingBooth: null,
    };

    // Validar identification si se actualiza
    if (
      updateVoterDto.identification &&
      updateVoterDto.identification !== voter.identification
    ) {
      validations.existingIdentification = await this.voterRepository.findOneBy(
        {
          identification: updateVoterDto.identification,
        },
      );

      if (validations.existingIdentification) {
        throw new BadRequestException(
          `La identificación ${updateVoterDto.identification} ya existe`,
        );
      }
    }

    // Validar email si se actualiza
    if (updateVoterDto.email && updateVoterDto.email !== voter.email) {
      validations.existingEmail = await this.voterRepository.findOneBy({
        email: updateVoterDto.email,
      });

      if (validations.existingEmail) {
        throw new BadRequestException(
          `El email ${updateVoterDto.email} ya existe`,
        );
      }
    }

    // Validar departamento si se actualiza (y es diferente del actual)
    if (
      updateVoterDto.departmentId &&
      updateVoterDto.departmentId !== voter.departmentId
    ) {
      validations.department = await this.departmentRepository.findOneBy({
        id: updateVoterDto.departmentId,
      });

      if (!validations.department) {
        throw new BadRequestException(
          `Departamento con ID ${updateVoterDto.departmentId} no encontrado`,
        );
      }
    }

    // Validar municipio si se actualiza (y es diferente del actual)
    if (
      updateVoterDto.municipalityId &&
      updateVoterDto.municipalityId !== voter.municipalityId
    ) {
      validations.municipality = await this.municipalityRepository.findOneBy({
        id: updateVoterDto.municipalityId,
      });

      if (!validations.municipality) {
        throw new BadRequestException(
          `Municipio con ID ${updateVoterDto.municipalityId} no encontrado`,
        );
      }
    }

    // Validar puesto de votación si se actualiza (y es diferente del actual)
    if (
      updateVoterDto.votingBoothId &&
      updateVoterDto.votingBoothId !== voter.votingBoothId
    ) {
      validations.votingBooth = await this.votingBoothRepository.findOneBy({
        id: updateVoterDto.votingBoothId,
      });

      if (!validations.votingBooth) {
        throw new BadRequestException(
          `Puesto de votación con ID ${updateVoterDto.votingBoothId} no encontrado`,
        );
      }
    }

    // Actualizar votante
    await this.voterRepository.update(id, updateVoterDto);

    if (this.cacheService) {
      await this.cacheService.invalidate(`voters:${id}`);
      await this.cacheService.invalidate('voters:all');
      await this.cacheService.invalidateByPattern('voters:identification:*');
      // 🔥 Invalidar listados cuando se actualiza votante
      await this.cacheService.invalidateByPattern('voters:list:*');
      // También invalidar reportes y estadísticas
      await this.cacheService.invalidateByPattern('report:voters:*');
      await this.cacheService.invalidateByPattern('stats:voting:*');
    }

    return await this.findOneWithAllRelations(id);
  }

  async remove(id: number): Promise<void> {
    const voter = await this.voterRepository.findOneBy({ id });

    if (!voter) {
      throw new NotFoundException(`Votante con ID ${id} no encontrado`);
    }

    // Eliminar todas las asignaciones de candidatos para este votante
    await this.candidateVoterRepository.delete({ voterId: id });

    // Ahora sí puedes borrar el votante
    await this.voterRepository.delete(id);

    if (this.cacheService) {
      await this.cacheService.invalidate(`voters:${id}`);
      await this.cacheService.invalidate('voters:all');
      await this.cacheService.invalidateByPattern('voters:identification:*');
      // 🔥 Invalidar listados cuando se elimina votante
      await this.cacheService.invalidateByPattern('voters:list:*');
      // Invalidar reportes y estadísticas al eliminar votante
      await this.cacheService.invalidateByPattern('report:voters:*');
      await this.cacheService.invalidateByPattern('stats:voting:*');
    }
  }

  async assignCandidate(voterId: number, candidateId: number): Promise<Voter> {
    const voter = await this.voterRepository.findOne({
      where: { id: voterId },
      relations: ['candidates'],
    });

    if (!voter) {
      throw new NotFoundException(`Votante con ID ${voterId} no encontrado`);
    }

    const candidate = await this.candidateRepository.findOneBy({
      id: candidateId,
    });

    if (!candidate) {
      throw new NotFoundException(
        `Candidato con ID ${candidateId} no encontrado`,
      );
    }

    voter.candidates.push(candidate);
    const saved = await this.voterRepository.save(voter);

    // 🔥 Invalidar caché cuando se asigna candidato
    if (this.cacheService) {
      try {
        await this.cacheService.invalidateByPattern('voters:list:*');
        await this.cacheService.invalidateByPattern('report:voters:*');
        await this.cacheService.invalidateByPattern('stats:voting:*');
      } catch (err) {
        // Continuar si falla invalidación
      }
    }

    return saved;
  }

  async getAssignedCandidates(voterId: number): Promise<CandidateVoter[]> {
    const voter = await this.voterRepository.findOneBy({ id: voterId });

    if (!voter) {
      throw new NotFoundException(`Votante con ID ${voterId} no encontrado`);
    }

    const assignments = await this.candidateVoterRepository.find({
      where: { voterId },
      relations: ['candidate', 'leader'],
    });

    return assignments;
  }

  async updateAssignedCandidates(
    voterId: number,
    assignCandidateDto: AssignCandidateDto,
  ): Promise<CandidateVoter[]> {
    const voter = await this.voterRepository.findOneBy({ id: voterId });

    if (!voter) {
      throw new NotFoundException(`Votante con ID ${voterId} no encontrado`);
    }

    // Validar que el líder existe y todos los candidatos en batch (no N+1)
    const [leader, candidates] = await Promise.all([
      this.leaderRepository.findOneBy({
        id: assignCandidateDto.leader_id,
      }),
      this.candidateRepository.find({
        where: { id: In(assignCandidateDto.candidate_ids) },
      }),
    ]);

    if (!leader) {
      throw new NotFoundException(
        `Líder con ID ${assignCandidateDto.leader_id} no encontrado`,
      );
    }

    if (candidates.length !== assignCandidateDto.candidate_ids.length) {
      const foundIds = candidates.map((c) => c.id);
      const missingId = assignCandidateDto.candidate_ids.find(
        (id) => !foundIds.includes(id),
      );
      throw new NotFoundException(
        `Candidato con ID ${missingId} no encontrado`,
      );
    }

    // Eliminar asignaciones previas para este votante
    await this.candidateVoterRepository.delete({ voterId });

    // Crear nuevas asignaciones en BATCH (1 query en lugar de N queries)
    const valuesToInsert = assignCandidateDto.candidate_ids.map(
      (candidateId) => ({
        voterId,
        candidateId,
        leaderId: assignCandidateDto.leader_id,
      }),
    );
    await this.candidateVoterRepository.insert(valuesToInsert);

    // Retornar las asignaciones actualizado con las relaciones
    const results = await this.candidateVoterRepository.find({
      where: { voterId },
      relations: ['candidate', 'leader'],
    });

    if (!results || results.length === 0) {
      throw new BadRequestException(
        'Error al recuperar las asignaciones creadas',
      );
    }

    // Invalidar caché de reportes y estadísticas al asignar candidatos
    if (this.cacheService) {
      await this.cacheService.invalidateByPattern('report:voters:*');
      await this.cacheService.invalidateByPattern('stats:voting:*');
    }

    return results;
  }

  async getVoterReport(
    filters: VoterReportFilterDto,
    user?: any,
  ): Promise<{
    data: VoterReportDto[];
    page: number;
    limit: number;
    total: number;
    pages: number;
    aggregations: any;
  }> {
    // Crear clave de caché basada en filtros y usuario (sin paginación para evitar fragmentación)
    const cacheKey = this.generateReportCacheKey(filters, user);

    if (this.cacheService) {
      return await this.cacheService.get(
        cacheKey,
        () => this.executeVoterReport(filters, user),
        300, // 5 minutos - reportes pueden ser menos frescos
      );
    }

    return await this.executeVoterReport(filters, user);
  }

  private generateReportCacheKey(filters: any, user?: any): string {
    const filterKey = Object.entries(filters)
      .filter(([key]) => key !== 'page' && key !== 'limit') // Excluir paginación
      .map(([key, value]) => `${key}:${value}`)
      .join('|');

    const orgKey = user?.organizationId
      ? `org:${user.organizationId}`
      : 'org:all';
    return `report:voters:${orgKey}:${filterKey || 'all'}`;
  }

  private async executeVoterReport(
    filters: VoterReportFilterDto,
    user?: any,
  ): Promise<{
    data: VoterReportDto[];
    page: number;
    limit: number;
    total: number;
    pages: number;
    aggregations: any;
  }> {
    // 🔧 OPTIMIZACIÓN: Usar subquery para DISTINCT voter IDs primero
    // Esto evita cargar 7K+ votantes en RAM, solo filtra IDs únicos en DB

    let voterIdQuery = this.candidateVoterRepository
      .createQueryBuilder('cv')
      .select('DISTINCT voter.id', 'voterId')
      .leftJoin('cv.voter', 'voter')
      .leftJoin('cv.candidate', 'candidate')
      .leftJoin('candidate.campaign', 'campaign')
      .leftJoin('candidate.corporation', 'corporation');

    // Aplicar filtros organizacionales
    if (user && user.organizationId) {
      voterIdQuery = voterIdQuery.andWhere(
        'campaign.organizationId = :organizationId',
        {
          organizationId: user.organizationId,
        },
      );
    }

    // Aplicar filtros de datos
    if (filters.gender) {
      voterIdQuery = voterIdQuery.andWhere('voter.gender = :gender', {
        gender: filters.gender,
      });
    }

    if (filters.leaderId) {
      const leaderId = parseInt(filters.leaderId as any);
      if (!isNaN(leaderId) && leaderId > 0) {
        voterIdQuery = voterIdQuery.andWhere('cv.leaderId = :leaderId', {
          leaderId,
        });
      }
    }

    if (filters.candidateId) {
      const candidateId = parseInt(filters.candidateId as any);
      if (!isNaN(candidateId) && candidateId > 0) {
        voterIdQuery = voterIdQuery.andWhere('cv.candidateId = :candidateId', {
          candidateId,
        });
      }
    }

    if (filters.corporationId) {
      const corporationId = parseInt(filters.corporationId as any);
      if (!isNaN(corporationId) && corporationId > 0) {
        voterIdQuery = voterIdQuery.andWhere(
          'corporation.id = :corporationId',
          {
            corporationId,
          },
        );
      }
    }

    if (filters.departmentId) {
      const departmentId = parseInt(filters.departmentId as any);
      if (!isNaN(departmentId) && departmentId > 0) {
        voterIdQuery = voterIdQuery.andWhere(
          'voter.departmentId = :departmentId',
          {
            departmentId,
          },
        );
      }
    }

    if (filters.municipalityId) {
      const municipalityId = parseInt(filters.municipalityId as any);
      if (!isNaN(municipalityId) && municipalityId > 0) {
        voterIdQuery = voterIdQuery.andWhere(
          'voter.municipalityId = :municipalityId',
          {
            municipalityId,
          },
        );
      }
    }

    if (filters.votingBoothId) {
      const votingBoothId = parseInt(filters.votingBoothId as any);
      if (!isNaN(votingBoothId) && votingBoothId > 0) {
        voterIdQuery = voterIdQuery.andWhere(
          'voter.votingBoothId = :votingBoothId',
          {
            votingBoothId,
          },
        );
      }
    }

    if (filters.votingTableId) {
      const votingTableId = String(filters.votingTableId).trim();
      if (votingTableId) {
        voterIdQuery = voterIdQuery.andWhere(
          'voter.votingTableId = :votingTableId',
          {
            votingTableId,
          },
        );
      }
    }

    // PASO 1: Obtener IDs únicos de votantes (sin paginación, para contar total)
    const allVoterIds = await voterIdQuery.getRawMany();
    const totalCount = allVoterIds.length;

    // PASO 2: Paginar IDs
    const page = Math.max(1, parseInt(filters.page as any) || 1);
    const limit = Math.max(
      1,
      Math.min(parseInt(filters.limit as any) || 20, 100),
    );
    const skip = (page - 1) * limit;

    const paginatedVoterIds = allVoterIds
      .slice(skip, skip + limit)
      .map((row) => row.voterId);

    // PASO 3: Si no hay votantes, retornar vacío
    if (paginatedVoterIds.length === 0) {
      const aggregations = await this.getAggregations(filters, user);
      return {
        data: [],
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        aggregations,
      };
    }

    // PASO 4: Cargar relaciones solo para votantes paginados
    let detailQuery = this.candidateVoterRepository
      .createQueryBuilder('cv')
      .leftJoinAndSelect('cv.voter', 'voter')
      .leftJoinAndSelect('voter.department', 'department')
      .leftJoinAndSelect('voter.municipality', 'municipality')
      .leftJoinAndSelect('voter.votingBooth', 'votingBooth')
      .leftJoinAndSelect('cv.candidate', 'candidate')
      .leftJoinAndSelect('candidate.corporation', 'corporation')
      .leftJoinAndSelect('candidate.campaign', 'campaign')
      .leftJoinAndSelect('campaign.organization', 'organization')
      .leftJoinAndSelect('cv.leader', 'leader')
      .where('voter.id IN (:...voterIds)', { voterIds: paginatedVoterIds });

    const detailResults = await detailQuery.getMany();

    // PASO 5: Agrupar resultados por votante
    const votersMap = new Map<number, VoterReportDto>();

    detailResults.forEach((assignment) => {
      const voterId = assignment.voter.id;
      if (!votersMap.has(voterId)) {
        votersMap.set(voterId, {
          id: assignment.voter.id,
          firstName: assignment.voter.firstName,
          lastName: assignment.voter.lastName,
          identification: assignment.voter.identification,
          gender: assignment.voter.gender,
          phone: assignment.voter.phone,
          email: assignment.voter.email,
          departmentId: assignment.voter.departmentId,
          department: assignment.voter.department
            ? {
                id: assignment.voter.department.id,
                name: assignment.voter.department.name,
              }
            : undefined,
          municipalityId: assignment.voter.municipalityId,
          municipality: assignment.voter.municipality
            ? {
                id: assignment.voter.municipality.id,
                name: assignment.voter.municipality.name,
              }
            : undefined,
          neighborhood: assignment.voter.neighborhood,
          votingBoothId: assignment.voter.votingBoothId,
          votingBooth: assignment.voter.votingBooth
            ? {
                id: assignment.voter.votingBooth.id,
                name: assignment.voter.votingBooth.name,
                code: assignment.voter.votingBooth.code,
              }
            : undefined,
          votingTableId: assignment.voter.votingTableId,
          candidates: [],
          leaders: [],
        });
      }

      const voter = votersMap.get(voterId);

      if (!voter) return;

      // Agregar candidato si no existe
      if (assignment.candidate) {
        const candidateExists = (voter.candidates || []).some(
          (c) => c.id === assignment.candidate.id,
        );
        if (!candidateExists) {
          if (!voter.candidates) voter.candidates = [];
          voter.candidates.push({
            id: assignment.candidate.id,
            name: assignment.candidate.name,
            party: assignment.candidate.party,
            number: assignment.candidate.number,
            corporation: assignment.candidate.corporation
              ? {
                  id: assignment.candidate.corporation.id,
                  name: assignment.candidate.corporation.name,
                }
              : undefined,
          });
        }
      }

      // Agregar líder si no existe
      if (assignment.leader) {
        const leaderExists = (voter.leaders || []).some(
          (l) => l.id === assignment.leader?.id,
        );
        if (!leaderExists) {
          if (!voter.leaders) voter.leaders = [];
          voter.leaders.push({
            id: assignment.leader.id,
            name: assignment.leader.name,
          });
        }
      }
    });

    const paginatedVoters = Array.from(votersMap.values());

    // Obtener agregaciones
    const aggregations = await this.getAggregations(filters, user);

    return {
      data: paginatedVoters,
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
      aggregations,
    };
  }

  private async getAggregations(
    filters: VoterReportFilterDto,
    user?: any,
  ): Promise<any> {
    // Función helper para aplicar filtros comunes
    const applyFilters = (query: any) => {
      // Filter by user's organization
      // This applies to: campaign admins (roleId=2) and digitadores (roleId=5)
      if (user && user.organizationId) {
        query = query.andWhere('campaign.organizationId = :organizationId', {
          organizationId: user.organizationId,
        });
      }

      if (filters.votingBoothId) {
        const votingBoothId = parseInt(filters.votingBoothId as any);
        if (!isNaN(votingBoothId)) {
          query = query.andWhere('voter.votingBoothId = :votingBoothId', {
            votingBoothId,
          });
        }
      }

      if (filters.votingTableId) {
        const votingTableId = String(filters.votingTableId).trim();
        if (votingTableId) {
          query = query.andWhere('voter.votingTableId = :votingTableId', {
            votingTableId,
          });
        }
      }

      return query;
    };

    // Crear todas las queries de agregación
    let genderQuery = this.candidateVoterRepository
      .createQueryBuilder('cv')
      .leftJoinAndSelect('cv.voter', 'voter')
      .leftJoinAndSelect('cv.candidate', 'candidate')
      .leftJoinAndSelect('candidate.campaign', 'campaign')
      .select('voter.gender', 'gender')
      .addSelect('COUNT(DISTINCT voter.id)', 'count')
      .groupBy('voter.gender');
    genderQuery = applyFilters(genderQuery);

    let leaderQuery = this.candidateVoterRepository
      .createQueryBuilder('cv')
      .leftJoinAndSelect('cv.leader', 'leader')
      .leftJoinAndSelect('cv.voter', 'voter')
      .leftJoinAndSelect('cv.candidate', 'candidate')
      .leftJoinAndSelect('candidate.campaign', 'campaign')
      .select('leader.id', 'id')
      .addSelect('leader.name', 'name')
      .addSelect('COUNT(DISTINCT cv.voterId)', 'count')
      .groupBy('leader.id')
      .addGroupBy('leader.name');
    leaderQuery = applyFilters(leaderQuery);

    let candidateQuery = this.candidateVoterRepository
      .createQueryBuilder('cv')
      .leftJoinAndSelect('cv.candidate', 'candidate')
      .leftJoinAndSelect('candidate.corporation', 'corporation')
      .leftJoinAndSelect('candidate.campaign', 'campaign')
      .leftJoinAndSelect('cv.voter', 'voter')
      .select('candidate.id', 'id')
      .addSelect('candidate.name', 'name')
      .addSelect('corporation.name', 'corporationName')
      .addSelect('COUNT(DISTINCT cv.voterId)', 'count')
      .groupBy('candidate.id')
      .addGroupBy('candidate.name')
      .addGroupBy('corporation.name');
    candidateQuery = applyFilters(candidateQuery);

    let locationQuery = this.candidateVoterRepository
      .createQueryBuilder('cv')
      .leftJoinAndSelect('cv.voter', 'voter')
      .leftJoinAndSelect('voter.department', 'department')
      .leftJoinAndSelect('voter.municipality', 'municipality')
      .leftJoinAndSelect('cv.candidate', 'candidate')
      .leftJoinAndSelect('candidate.campaign', 'campaign')
      .select('department.id', 'departmentId')
      .addSelect('department.name', 'departmentName')
      .addSelect('municipality.id', 'municipalityId')
      .addSelect('municipality.name', 'municipalityName')
      .addSelect('COUNT(DISTINCT voter.id)', 'count')
      .groupBy('department.id')
      .addGroupBy('department.name')
      .addGroupBy('municipality.id')
      .addGroupBy('municipality.name');
    locationQuery = applyFilters(locationQuery);

    // Ejecutar todas las queries en PARALELO
    const [genderCount, leaderCount, candidateCount, locationCount] =
      await Promise.all([
        genderQuery.getRawMany(),
        leaderQuery.getRawMany(),
        candidateQuery.getRawMany(),
        locationQuery.getRawMany(),
      ]);

    return {
      byGender: genderCount,
      byLeader: leaderCount,
      byCandidate: candidateCount,
      byLocation: locationCount,
    };
  }

  async searchByIdentification(
    identification: string,
    user: any,
  ): Promise<VoterSearchByIdentificationDto> {
    // Step 1: Check if voter exists with assignments in user's organization
    let userOrgId = user?.organizationId ? Number(user.organizationId) : null;

    if (userOrgId) {
      // Search for voter with assignments specifically in user's organization
      const voterInUserOrg = await this.candidateVoterRepository
        .createQueryBuilder('cv')
        .leftJoinAndSelect('cv.voter', 'voter')
        .leftJoinAndSelect('cv.candidate', 'candidate')
        .leftJoinAndSelect('candidate.campaign', 'campaign')
        .leftJoinAndSelect('cv.leader', 'leader')
        .where('voter.identification = :identification', { identification })
        .andWhere('campaign.organizationId = :orgId', { orgId: userOrgId })
        .getOne();

      if (voterInUserOrg) {
        // Get all assignments for this voter in user's organization
        const allAssignmentsInUserOrg =
          await this.candidateVoterRepository.find({
            where: { voterId: voterInUserOrg.voter.id },
            relations: ['candidate', 'candidate.campaign', 'leader'],
          });

        const userOrgAssignments = allAssignmentsInUserOrg.filter(
          (assignment) =>
            assignment.candidate.campaign &&
            Number(assignment.candidate.campaign.organizationId) === userOrgId,
        );

        if (userOrgAssignments.length > 0) {
          const candidates = userOrgAssignments.map((assignment) => ({
            id: assignment.candidate.id,
            name: assignment.candidate.name,
            party: assignment.candidate.party,
            number: assignment.candidate.number,
            organizationId:
              assignment.candidate.campaign?.organizationId || null,
            campaignName: assignment.candidate.campaign?.name || '',
          }));

          const leader = userOrgAssignments[0]?.leader
            ? {
                id: userOrgAssignments[0].leader.id,
                name: userOrgAssignments[0].leader.name,
                document: userOrgAssignments[0].leader.document,
                municipality: userOrgAssignments[0].leader.municipality,
                phone: userOrgAssignments[0].leader.phone,
              }
            : undefined;

          return {
            status: 'assigned',
            voter: {
              id: voterInUserOrg.voter.id,
              firstName: voterInUserOrg.voter.firstName,
              lastName: voterInUserOrg.voter.lastName,
              identification: voterInUserOrg.voter.identification,
              gender: voterInUserOrg.voter.gender,
              bloodType: voterInUserOrg.voter.bloodType,
              birthDate: voterInUserOrg.voter.birthDate,
              phone: voterInUserOrg.voter.phone,
              address: voterInUserOrg.voter.address,
              departmentId: voterInUserOrg.voter.departmentId,
              municipalityId: voterInUserOrg.voter.municipalityId,
              neighborhood: voterInUserOrg.voter.neighborhood,
              email: voterInUserOrg.voter.email,
              occupation: voterInUserOrg.voter.occupation,
              votingBoothId: voterInUserOrg.voter.votingBoothId,
              votingTableId: voterInUserOrg.voter.votingTableId,
              politicalStatus: voterInUserOrg.voter.politicalStatus,
              hasVoted: voterInUserOrg.voter.hasVoted,
            },
            assignedLeader: leader,
            assignedCandidates: candidates,
            message: `El votante ${voterInUserOrg.voter.firstName} ${voterInUserOrg.voter.lastName} ya existe y está asignado`,
          };
        }
      }
    }

    // Step 2: If not found in user's organization, check voters_history
    const voterHistory = await this.votersHistoryRepository.findOne({
      where: { identification },
    });

    if (voterHistory) {
      return {
        status: 'in_history',
        votersHistoryData: {
          firstName: voterHistory.firstName,
          lastName: voterHistory.lastName,
          identification: voterHistory.identification,
          gender: voterHistory.gender,
          bloodType: voterHistory.bloodType,
          birthDate: voterHistory.birthDate,
          phone: voterHistory.phone,
          address: voterHistory.address,
          departmentId: voterHistory.departmentId,
          municipalityId: voterHistory.municipalityId,
          neighborhood: voterHistory.neighborhood,
          email: voterHistory.email,
          occupation: voterHistory.occupation,
          votingBoothId: voterHistory.votingBoothId,
          votingTableId: voterHistory.votingTableId,
          politicalStatus: voterHistory.politicalStatus,
        },
        message: `Datos encontrados en historial de votantes`,
      };
    }

    // Step 3: If not found anywhere
    return {
      status: 'not_found',
      message: `No se encontró información para la identificación ${identification}`,
    };
  }

  async searchByIdentificationForDiaD(
    identification: string,
    user: any,
  ): Promise<VoterSearchByIdentificationDto> {
    // Búsqueda SOLO en votantes activos para el Día D
    // NO busca en historial
    let userOrgId = user?.organizationId ? Number(user.organizationId) : null;

    if (userOrgId) {
      // Search for voter with assignments specifically in user's organization
      const voterInUserOrg = await this.candidateVoterRepository
        .createQueryBuilder('cv')
        .leftJoinAndSelect('cv.voter', 'voter')
        .leftJoinAndSelect('cv.candidate', 'candidate')
        .leftJoinAndSelect('candidate.campaign', 'campaign')
        .leftJoinAndSelect('cv.leader', 'leader')
        .where('voter.identification = :identification', { identification })
        .andWhere('campaign.organizationId = :orgId', { orgId: userOrgId })
        .getOne();

      if (voterInUserOrg) {
        // Get all assignments for this voter in user's organization
        const allAssignmentsInUserOrg =
          await this.candidateVoterRepository.find({
            where: { voterId: voterInUserOrg.voter.id },
            relations: ['candidate', 'candidate.campaign', 'leader'],
          });

        const userOrgAssignments = allAssignmentsInUserOrg.filter(
          (assignment) =>
            assignment.candidate.campaign &&
            Number(assignment.candidate.campaign.organizationId) === userOrgId,
        );

        if (userOrgAssignments.length > 0) {
          const candidates = userOrgAssignments.map((assignment) => ({
            id: assignment.candidate.id,
            name: assignment.candidate.name,
            party: assignment.candidate.party,
            number: assignment.candidate.number,
            organizationId:
              assignment.candidate.campaign?.organizationId || null,
            campaignName: assignment.candidate.campaign?.name || '',
          }));

          const leader = userOrgAssignments[0]?.leader
            ? {
                id: userOrgAssignments[0].leader.id,
                name: userOrgAssignments[0].leader.name,
                document: userOrgAssignments[0].leader.document,
                municipality: userOrgAssignments[0].leader.municipality,
                phone: userOrgAssignments[0].leader.phone,
              }
            : undefined;

          return {
            status: 'assigned',
            voter: {
              id: voterInUserOrg.voter.id,
              firstName: voterInUserOrg.voter.firstName,
              lastName: voterInUserOrg.voter.lastName,
              identification: voterInUserOrg.voter.identification,
              gender: voterInUserOrg.voter.gender,
              bloodType: voterInUserOrg.voter.bloodType,
              birthDate: voterInUserOrg.voter.birthDate,
              phone: voterInUserOrg.voter.phone,
              address: voterInUserOrg.voter.address,
              departmentId: voterInUserOrg.voter.departmentId,
              municipalityId: voterInUserOrg.voter.municipalityId,
              neighborhood: voterInUserOrg.voter.neighborhood,
              email: voterInUserOrg.voter.email,
              occupation: voterInUserOrg.voter.occupation,
              votingBoothId: voterInUserOrg.voter.votingBoothId,
              votingTableId: voterInUserOrg.voter.votingTableId,
              politicalStatus: voterInUserOrg.voter.politicalStatus,
              hasVoted: voterInUserOrg.voter.hasVoted,
            },
            assignedLeader: leader,
            assignedCandidates: candidates,
            message: `El votante ${voterInUserOrg.voter.firstName} ${voterInUserOrg.voter.lastName} ya existe y está asignado`,
          };
        }
      }
    } else {
      // Global admin: buscar en TODOS los votantes activos
      const voter = await this.voterRepository.findOne({
        where: { identification },
        relations: ['candidates', 'candidates.campaign'],
      });

      if (voter && voter.candidates && voter.candidates.length > 0) {
        const candidates = voter.candidates.map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          party: candidate.party,
          number: candidate.number,
          organizationId: candidate.campaign?.organizationId || null,
          campaignName: candidate.campaign?.name || '',
        }));

        return {
          status: 'assigned',
          voter: {
            id: voter.id,
            firstName: voter.firstName,
            lastName: voter.lastName,
            identification: voter.identification,
            gender: voter.gender,
            bloodType: voter.bloodType,
            birthDate: voter.birthDate,
            phone: voter.phone,
            address: voter.address,
            departmentId: voter.departmentId,
            municipalityId: voter.municipalityId,
            neighborhood: voter.neighborhood,
            email: voter.email,
            occupation: voter.occupation,
            votingBoothId: voter.votingBoothId,
            votingTableId: voter.votingTableId,
            politicalStatus: voter.politicalStatus,
            hasVoted: voter.hasVoted,
          },
          assignedCandidates: candidates,
          message: `El votante ${voter.firstName} ${voter.lastName} ya existe y está asignado`,
        };
      }
    }

    // If not found in active voters (NO history search for DiaD)
    return {
      status: 'not_found',
      message: `No se encontró un votante activo con la identificación ${identification}`,
    };
  }

  async registerVote(identification: string, user: any): Promise<Voter> {
    // Find voter by identification
    const voter = await this.voterRepository.findOne({
      where: { identification },
    });

    if (!voter) {
      throw new NotFoundException(
        `Votante con identificación ${identification} no encontrado`,
      );
    }

    // Check if voter has already voted
    if (voter.hasVoted) {
      throw new BadRequestException(
        `El votante ${voter.firstName} ${voter.lastName} ya ha votado`,
      );
    }

    // Register the vote
    voter.hasVoted = true;
    const saved = await this.voterRepository.save(voter);

    // 🔥 Invalidar caché cuando se registra voto
    if (this.cacheService) {
      try {
        await this.cacheService.invalidateByPattern('voters:list:*');
        await this.cacheService.invalidateByPattern('voters:identification:*');
        await this.cacheService.invalidateByPattern('report:voters:*');
        await this.cacheService.invalidateByPattern('stats:voting:*');
      } catch (err) {
        // Continuar si falla invalidación
      }
    }

    return saved;
  }

  async unregisterVote(identification: string, user: any): Promise<Voter> {
    // Find voter by identification
    const voter = await this.voterRepository.findOne({
      where: { identification },
    });

    if (!voter) {
      throw new NotFoundException(
        `Votante con identificación ${identification} no encontrado`,
      );
    }

    // Check if voter has already voted
    if (!voter.hasVoted) {
      throw new BadRequestException(
        `El votante ${voter.firstName} ${voter.lastName} no ha registrado un voto`,
      );
    }

    // Unregister the vote (set hasVoted to false)
    voter.hasVoted = false;
    const saved = await this.voterRepository.save(voter);

    // 🔥 Invalidar caché cuando se desregistra voto
    if (this.cacheService) {
      try {
        await this.cacheService.invalidateByPattern('voters:list:*');
        await this.cacheService.invalidateByPattern('voters:identification:*');
        await this.cacheService.invalidateByPattern('report:voters:*');
        await this.cacheService.invalidateByPattern('stats:voting:*');
      } catch (err) {
        // Continuar si falla invalidación
      }
    }

    return saved;
  }

  async getVotingStats(user: any): Promise<{
    expected: number;
    registered: number;
    pending: number;
  }> {
    // Crear clave de caché basada en organización del usuario
    const cacheKey = user?.organizationId
      ? `stats:voting:org:${user.organizationId}`
      : 'stats:voting:all';

    if (this.cacheService) {
      return await this.cacheService.get(
        cacheKey,
        () => this.executeVotingStats(user),
        120, // 2 minutos - estadísticas en tiempo casi real
      );
    }

    return await this.executeVotingStats(user);
  }

  private async executeVotingStats(user: any): Promise<{
    expected: number;
    registered: number;
    pending: number;
  }> {
    // If user has organizationId, filter voters by organization
    if (user?.organizationId) {
      // Get campaigns for this organization
      const campaigns = await this.voterRepository.query(
        'SELECT id FROM campaigns WHERE "organizationId" = $1',
        [user.organizationId],
      );
      const campaignIds = campaigns.map((c) => c.id);

      if (campaignIds.length === 0) {
        return {
          expected: 0,
          registered: 0,
          pending: 0,
        };
      }

      // Get voters assigned to candidates in these campaigns
      const [expectedQuery, registeredQuery] = await Promise.all([
        this.voterRepository.query(
          `SELECT DISTINCT v.id FROM voters v
           INNER JOIN candidate_voter cv ON v.id = cv."voter_id"
           INNER JOIN candidates c ON cv."candidate_id" = c.id
           WHERE c."campaignId" IN (${campaignIds.join(',')})`,
        ),
        this.voterRepository.query(
          `SELECT DISTINCT v.id FROM voters v
           INNER JOIN candidate_voter cv ON v.id = cv."voter_id"
           INNER JOIN candidates c ON cv."candidate_id" = c.id
           WHERE c."campaignId" IN (${campaignIds.join(',')}) AND v."hasvoted" = true`,
        ),
      ]);

      const expected = expectedQuery.length;
      const registered = registeredQuery.length;
      const pending = expected - registered;

      return {
        expected,
        registered,
        pending,
      };
    }

    // If no organizationId, return global stats
    const expected = await this.voterRepository.count();

    const registered = await this.voterRepository.count({
      where: { hasVoted: true },
    });

    const pending = expected - registered;

    return {
      expected,
      registered,
      pending,
    };
  }

  async getVotersByStatus(
    hasVoted: boolean,
    paginationQueryDto: any,
    user: any,
  ): Promise<any> {
    const page = paginationQueryDto.page || 1;
    const limit = paginationQueryDto.limit || 20;
    const skip = (page - 1) * limit;

    // If user has organizationId, filter voters by organization
    if (user?.organizationId) {
      // Get campaigns for this organization
      const campaigns = await this.voterRepository.query(
        'SELECT id FROM campaigns WHERE "organizationId" = $1',
        [user.organizationId],
      );
      const campaignIds = campaigns.map((c) => c.id);

      if (campaignIds.length === 0) {
        return {
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0,
          },
        };
      }

      // Get voters assigned to candidates in these campaigns with pagination
      const [voters, total] = await Promise.all([
        this.voterRepository.query(
          `SELECT DISTINCT v.* FROM voters v
           INNER JOIN candidate_voter cv ON v.id = cv."voter_id"
           INNER JOIN candidates c ON cv."candidate_id" = c.id
           WHERE c."campaignId" IN (${campaignIds.join(',')}) AND v."hasvoted" = $1
           ORDER BY v."createdAt" DESC
           LIMIT $2 OFFSET $3`,
          [hasVoted, limit, skip],
        ),
        this.voterRepository.query(
          `SELECT COUNT(DISTINCT v.id) as count FROM voters v
           INNER JOIN candidate_voter cv ON v.id = cv."voter_id"
           INNER JOIN candidates c ON cv."candidate_id" = c.id
           WHERE c."campaignId" IN (${campaignIds.join(',')}) AND v."hasvoted" = $1`,
          [hasVoted],
        ),
      ]);

      return {
        data: voters,
        pagination: {
          total: parseInt(total[0]?.count || 0, 10),
          page,
          limit,
          pages: Math.ceil(parseInt(total[0]?.count || 0, 10) / limit),
        },
      };
    }

    // If no organizationId, return all voters with this status
    const [voters, total] = await this.voterRepository.findAndCount({
      where: { hasVoted },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: voters,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async searchVotersByTrackingFilter(
    status: 'expected' | 'registered' | 'pending',
    identification: string,
    paginationQueryDto: any,
    user: any,
  ): Promise<any> {
    const page = paginationQueryDto.page || 1;
    const limit = paginationQueryDto.limit || 20;
    const skip = (page - 1) * limit;
    const searchTerm = `%${identification.toLowerCase()}%`;

    // If user has organizationId, filter voters by organization
    if (user?.organizationId) {
      // Get campaigns for this organization
      const campaigns = await this.voterRepository.query(
        'SELECT id FROM campaigns WHERE "organizationId" = $1',
        [user.organizationId],
      );
      const campaignIds = campaigns.map((c) => c.id);

      if (campaignIds.length === 0) {
        return {
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0,
          },
        };
      }

      // Build WHERE clause based on status
      let statusWhere = '';
      if (status === 'registered') {
        statusWhere = 'AND v."hasvoted" = true';
      } else if (status === 'pending') {
        statusWhere = 'AND v."hasvoted" = false';
      }
      // For 'expected', no additional WHERE clause needed (all voters)

      // Get voters by tracking filter and identification with pagination
      const [voters, total] = await Promise.all([
        this.voterRepository.query(
          `SELECT DISTINCT v.* FROM voters v
           INNER JOIN candidate_voter cv ON v.id = cv."voter_id"
           INNER JOIN candidates c ON cv."candidate_id" = c.id
           WHERE c."campaignId" IN (${campaignIds.join(',')}) 
           AND LOWER(v."identification") LIKE $1
           ${statusWhere}
           ORDER BY v."identification" ASC
           LIMIT $2 OFFSET $3`,
          [searchTerm, limit, skip],
        ),
        this.voterRepository.query(
          `SELECT COUNT(DISTINCT v.id) as count FROM voters v
           INNER JOIN candidate_voter cv ON v.id = cv."voter_id"
           INNER JOIN candidates c ON cv."candidate_id" = c.id
           WHERE c."campaignId" IN (${campaignIds.join(',')}) 
           AND LOWER(v."identification") LIKE $1
           ${statusWhere}`,
          [searchTerm],
        ),
      ]);

      return {
        data: voters,
        pagination: {
          total: parseInt(total[0]?.count || 0, 10),
          page,
          limit,
          pages: Math.ceil(parseInt(total[0]?.count || 0, 10) / limit),
        },
      };
    }

    // If no organizationId, search across all voters
    let where: any = {
      identification: ILike(`%${identification}%`),
    };

    if (status === 'registered') {
      where.hasVoted = true;
    } else if (status === 'pending') {
      where.hasVoted = false;
    }
    // For 'expected', no additional WHERE clause needed

    const [voters, total] = await this.voterRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { identification: 'ASC' },
    });

    return {
      data: voters,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async searchVotersByNameOrIdentification(
    search: string,
    paginationQueryDto: PaginationQueryDto,
    user?: any,
  ): Promise<PaginatedResponseDto<Voter>> {
    const { page = 1, limit = 20 } = paginationQueryDto;
    const skip = (page - 1) * limit;
    const searchTerm = `%${search.toLowerCase()}%`;

    // Si es digitador o admin de campaña, filtrar por organización
    if (
      user &&
      (user.roleId === 2 || user.roleId === 5) &&
      user.organizationId
    ) {
      // Contar total de resultados
      const countQuery = `
        SELECT COUNT(DISTINCT v.id) as count
        FROM voters v
        LEFT JOIN candidate_voter cv ON v.id = cv.voter_id
        LEFT JOIN candidates c ON cv.candidate_id = c.id
        LEFT JOIN campaigns cam ON c."campaignId" = cam.id
        LEFT JOIN leaders l ON cv.leader_id = l.id
        LEFT JOIN campaigns cam2 ON l."campaignId" = cam2.id
        LEFT JOIN users u ON v."createdByUserId" = u.id
        WHERE (
          LOWER(v."firstName") LIKE $1
          OR LOWER(v."lastName") LIKE $1
          OR LOWER(v.identification) LIKE $1
        )
        AND (
          cam."organizationId" = $2
          OR cam2."organizationId" = $2
          OR u."organizationId" = $2
        )
      `;

      const totalResult = await this.voterRepository.query(countQuery, [
        searchTerm,
        user.organizationId,
      ]);
      const total = parseInt(totalResult[0]?.count || '0');

      if (total === 0) {
        return {
          data: [],
          page,
          limit,
          total: 0,
          pages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      // Obtener voters paginados
      const dataQuery = `
        SELECT DISTINCT v.*
        FROM voters v
        LEFT JOIN candidate_voter cv ON v.id = cv.voter_id
        LEFT JOIN candidates c ON cv.candidate_id = c.id
        LEFT JOIN campaigns cam ON c."campaignId" = cam.id
        LEFT JOIN leaders l ON cv.leader_id = l.id
        LEFT JOIN campaigns cam2 ON l."campaignId" = cam2.id
        LEFT JOIN users u ON v."createdByUserId" = u.id
        WHERE (
          LOWER(v."firstName") LIKE $1
          OR LOWER(v."lastName") LIKE $1
          OR LOWER(v.identification) LIKE $1
        )
        AND (
          cam."organizationId" = $2
          OR cam2."organizationId" = $2
          OR u."organizationId" = $2
        )
        ORDER BY v."firstName" ASC
        LIMIT $3 OFFSET $4
      `;

      const voters = await this.voterRepository.query(dataQuery, [
        searchTerm,
        user.organizationId,
        limit,
        skip,
      ]);

      // Enriquecer con relaciones
      const voterIds = voters.map((v) => v.id);
      if (voterIds.length === 0) {
        return {
          data: [],
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        };
      }

      // Cargar relaciones
      const enrichedVoters = await this.voterRepository.find({
        where: { id: In(voterIds) },
        relations: ['department', 'municipality', 'votingBooth'],
      });

      // Cargar assignments
      const candidateVoters = await this.candidateVoterRepository.find({
        where: { voterId: In(voterIds) },
        relations: ['candidate', 'leader'],
      });

      const candidateMap = new Map();
      const leaderMap = new Map();

      candidateVoters.forEach((cv) => {
        if (!candidateMap.has(cv.voterId)) {
          candidateMap.set(cv.voterId, []);
        }
        if (cv.candidate) {
          candidateMap.get(cv.voterId).push(cv.candidate);
        }

        if (!leaderMap.has(cv.voterId)) {
          leaderMap.set(cv.voterId, []);
        }
        if (cv.leader) {
          leaderMap.get(cv.voterId).push(cv.leader);
        }
      });

      enrichedVoters.forEach((voter) => {
        voter.candidates = candidateMap.get(voter.id) || [];
        voter.leaders = leaderMap.get(voter.id) || [];
      });

      // Reordenar para que coincida con el orden de la query
      const orderedVoters = voterIds
        .map((id) => enrichedVoters.find((v) => v.id === id))
        .filter((v) => v !== undefined);

      return {
        data: orderedVoters,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      };
    }

    // Si es candidato (roleId=3), filtrar solo sus votantes
    if (user && user.roleId === 3) {
      // Obtener candidateId del usuario
      const candidate = await this.candidateRepository.findOne({
        where: { userId: user.id },
      });

      if (!candidate) {
        return {
          data: [],
          page,
          limit,
          total: 0,
          pages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      // Obtener voters de este candidato
      const candidateVoters = await this.candidateVoterRepository.find({
        where: { candidateId: candidate.id },
        select: ['voterId'],
      });
      const voterIds = candidateVoters.map((cv) => cv.voterId);

      if (voterIds.length === 0) {
        return {
          data: [],
          page,
          limit,
          total: 0,
          pages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      // Contar total de resultados
      const countQuery = `
        SELECT COUNT(DISTINCT v.id) as count
        FROM voters v
        WHERE (
          LOWER(v."firstName") LIKE $1
          OR LOWER(v."lastName") LIKE $1
          OR LOWER(v.identification) LIKE $1
        )
        AND v.id = ANY($2::integer[])
      `;

      const totalResult = await this.voterRepository.query(countQuery, [
        searchTerm,
        voterIds,
      ]);
      const total = parseInt(totalResult[0]?.count || '0');

      if (total === 0) {
        return {
          data: [],
          page,
          limit,
          total: 0,
          pages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      // Obtener voters paginados
      const dataQuery = `
        SELECT DISTINCT v.*
        FROM voters v
        WHERE (
          LOWER(v."firstName") LIKE $1
          OR LOWER(v."lastName") LIKE $1
          OR LOWER(v.identification) LIKE $1
        )
        AND v.id = ANY($2::integer[])
        ORDER BY v."firstName" ASC
        LIMIT $3 OFFSET $4
      `;

      const voters = await this.voterRepository.query(dataQuery, [
        searchTerm,
        voterIds,
        limit,
        skip,
      ]);

      // Enriquecer con relaciones
      const voterIdsFiltered = voters.map((v) => v.id);
      if (voterIdsFiltered.length === 0) {
        return {
          data: [],
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        };
      }

      const enrichedVoters = await this.voterRepository.find({
        where: { id: In(voterIdsFiltered) },
        relations: ['department', 'municipality', 'votingBooth'],
      });

      const candidateVotersEnriched = await this.candidateVoterRepository.find({
        where: { voterId: In(voterIdsFiltered) },
        relations: ['candidate', 'leader'],
      });

      const candidateMap = new Map();
      const leaderMap = new Map();

      candidateVotersEnriched.forEach((cv) => {
        if (!candidateMap.has(cv.voterId)) {
          candidateMap.set(cv.voterId, []);
        }
        if (cv.candidate) {
          candidateMap.get(cv.voterId).push(cv.candidate);
        }

        if (!leaderMap.has(cv.voterId)) {
          leaderMap.set(cv.voterId, []);
        }
        if (cv.leader) {
          leaderMap.get(cv.voterId).push(cv.leader);
        }
      });

      enrichedVoters.forEach((voter) => {
        voter.candidates = candidateMap.get(voter.id) || [];
        voter.leaders = leaderMap.get(voter.id) || [];
      });

      const orderedVoters = voterIdsFiltered
        .map((id) => enrichedVoters.find((v) => v.id === id))
        .filter((v) => v !== undefined);

      return {
        data: orderedVoters,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      };
    }

    // Si es líder (roleId=4), filtrar solo sus votantes
    if (user && user.roleId === 4) {
      // Obtener leaderId del usuario
      const leader = await this.leaderRepository.findOne({
        where: { userId: user.id },
      });

      if (!leader) {
        return {
          data: [],
          page,
          limit,
          total: 0,
          pages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      // Obtener voters de este líder
      const leaderVoters = await this.candidateVoterRepository.find({
        where: { leaderId: leader.id },
        select: ['voterId'],
      });
      const voterIds = leaderVoters.map((lv) => lv.voterId);

      if (voterIds.length === 0) {
        return {
          data: [],
          page,
          limit,
          total: 0,
          pages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      // Contar total de resultados
      const countQuery = `
        SELECT COUNT(DISTINCT v.id) as count
        FROM voters v
        WHERE (
          LOWER(v."firstName") LIKE $1
          OR LOWER(v."lastName") LIKE $1
          OR LOWER(v.identification) LIKE $1
        )
        AND v.id = ANY($2::integer[])
      `;

      const totalResult = await this.voterRepository.query(countQuery, [
        searchTerm,
        voterIds,
      ]);
      const total = parseInt(totalResult[0]?.count || '0');

      if (total === 0) {
        return {
          data: [],
          page,
          limit,
          total: 0,
          pages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      // Obtener voters paginados
      const dataQuery = `
        SELECT DISTINCT v.*
        FROM voters v
        WHERE (
          LOWER(v."firstName") LIKE $1
          OR LOWER(v."lastName") LIKE $1
          OR LOWER(v.identification) LIKE $1
        )
        AND v.id = ANY($2::integer[])
        ORDER BY v."firstName" ASC
        LIMIT $3 OFFSET $4
      `;

      const voters = await this.voterRepository.query(dataQuery, [
        searchTerm,
        voterIds,
        limit,
        skip,
      ]);

      // Enriquecer con relaciones
      const voterIdsFiltered = voters.map((v) => v.id);
      if (voterIdsFiltered.length === 0) {
        return {
          data: [],
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        };
      }

      const enrichedVoters = await this.voterRepository.find({
        where: { id: In(voterIdsFiltered) },
        relations: ['department', 'municipality', 'votingBooth'],
      });

      const leaderVotersEnriched = await this.candidateVoterRepository.find({
        where: { voterId: In(voterIdsFiltered) },
        relations: ['candidate', 'leader'],
      });

      const candidateMap = new Map();
      const leaderMap = new Map();

      leaderVotersEnriched.forEach((lv) => {
        if (!candidateMap.has(lv.voterId)) {
          candidateMap.set(lv.voterId, []);
        }
        if (lv.candidate) {
          candidateMap.get(lv.voterId).push(lv.candidate);
        }

        if (!leaderMap.has(lv.voterId)) {
          leaderMap.set(lv.voterId, []);
        }
        if (lv.leader) {
          leaderMap.get(lv.voterId).push(lv.leader);
        }
      });

      enrichedVoters.forEach((voter) => {
        voter.candidates = candidateMap.get(voter.id) || [];
        voter.leaders = leaderMap.get(voter.id) || [];
      });

      const orderedVoters = voterIdsFiltered
        .map((id) => enrichedVoters.find((v) => v.id === id))
        .filter((v) => v !== undefined);

      return {
        data: orderedVoters,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      };
    }

    // Para usuarios sin filtro organizacional
    const [voters, total] = await this.voterRepository
      .createQueryBuilder('voter')
      .where(
        'LOWER(voter.firstName) LIKE LOWER(:search) OR LOWER(voter.lastName) LIKE LOWER(:search) OR LOWER(voter.identification) LIKE LOWER(:search)',
        { search: searchTerm },
      )
      .skip(skip)
      .take(limit)
      .orderBy('voter.firstName', 'ASC')
      .getManyAndCount();

    // Cargar assignments
    const voterIds = voters.map((v) => v.id);
    if (voterIds.length > 0) {
      const candidateVoters = await this.candidateVoterRepository.find({
        where: { voterId: In(voterIds) },
        relations: ['candidate', 'leader'],
      });

      const candidateMap = new Map();
      const leaderMap = new Map();

      candidateVoters.forEach((cv) => {
        if (!candidateMap.has(cv.voterId)) {
          candidateMap.set(cv.voterId, []);
        }
        if (cv.candidate) {
          candidateMap.get(cv.voterId).push(cv.candidate);
        }

        if (!leaderMap.has(cv.voterId)) {
          leaderMap.set(cv.voterId, []);
        }
        if (cv.leader) {
          leaderMap.get(cv.voterId).push(cv.leader);
        }
      });

      voters.forEach((voter) => {
        voter.candidates = candidateMap.get(voter.id) || [];
        voter.leaders = leaderMap.get(voter.id) || [];
      });
    }

    return {
      data: voters,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };
  }

  async getAnalysisReport(filters: any, user?: any): Promise<any[]> {
    // Obtener IDs de votantes únicos basados en organización
    let voterIdQuery = this.candidateVoterRepository
      .createQueryBuilder('cv')
      .select('DISTINCT voter.id', 'voterId')
      .leftJoin('cv.voter', 'voter')
      .leftJoin('cv.candidate', 'candidate')
      .leftJoin('candidate.campaign', 'campaign');

    // Filtro por organización
    if (user && user.organizationId) {
      voterIdQuery = voterIdQuery.andWhere(
        'campaign.organizationId = :organizationId',
        {
          organizationId: user.organizationId,
        },
      );
    }

    const voterIds = await voterIdQuery.getRawMany();
    const voterIdList = voterIds.map((v) => v.voterId);

    // Si no hay votantes, retornar array vacío
    if (voterIdList.length === 0) {
      return [];
    }

    // Obtener datos de divipol para mapeo
    const divipolData = await this.divipolRepository.find();
    const divipolMap = {};
    divipolData.forEach((divipol) => {
      const key = `${divipol.puesto}_${divipol.mesa}`;
      divipolMap[key] = divipol.total_por_mesa;
    });

    // Construir query para obtener votantes con filtros de ubicación
    let query = this.voterRepository
      .createQueryBuilder('voter')
      .leftJoinAndSelect('voter.department', 'department')
      .leftJoinAndSelect('voter.municipality', 'municipality')
      .leftJoinAndSelect('voter.votingBooth', 'votingBooth')
      .whereInIds(voterIdList);

    // Filtros por ubicación
    if (filters.departmentId) {
      query = query.andWhere('voter.departmentId = :departmentId', {
        departmentId: parseInt(filters.departmentId, 10),
      });
    }

    if (filters.municipalityId) {
      query = query.andWhere('voter.municipalityId = :municipalityId', {
        municipalityId: parseInt(filters.municipalityId, 10),
      });
    }

    if (filters.votingBoothId) {
      query = query.andWhere('voter.votingBoothId = :votingBoothId', {
        votingBoothId: parseInt(filters.votingBoothId, 10),
      });
    }

    if (filters.votingTableId) {
      query = query.andWhere('voter.votingTableId = :votingTableId', {
        votingTableId: filters.votingTableId,
      });
    }

    const voters = await query.getMany();

    // Agrupar primero por puesto de votación, luego por mesa
    const groupedByBooth: { [key: string]: any } = {};

    voters.forEach((voter) => {
      const boothKey = `${voter.votingBooth?.id || 'N/A'}`;
      const mesa = voter.votingTableId || 'N/A';

      if (!groupedByBooth[boothKey]) {
        groupedByBooth[boothKey] = {
          departamento: voter.department?.name || 'N/A',
          municipio: voter.municipality?.name || 'N/A',
          puestoVotacion: voter.votingBooth?.name || 'N/A',
          totalPuesto: voter.votingBooth?.mesas || 0,
          mesas: {},
        };
      }

      if (!groupedByBooth[boothKey].mesas[mesa]) {
        groupedByBooth[boothKey].mesas[mesa] = [];
      }

      groupedByBooth[boothKey].mesas[mesa].push(voter);
    });

    // Convertir estructura a array con mesas procesadas
    const result = Object.entries(groupedByBooth).map(
      ([boothKey, booth]: any) => {
        const mesasArray = Object.entries(booth.mesas).map(
          ([mesa, votersInMesa]: any) => {
            const totalRegistrado = votersInMesa.length;
            const totalVotado = votersInMesa.filter((v) => v.hasVoted).length;

            // Extraer el número de la mesa (ej: "Mesa 1" -> 1)
            const mesaNumber = parseInt(mesa.replace(/\D/g, '')) || mesa;

            // Obtener el totalDivipol mapeando puesto y mesa
            const divipolKey = `${boothKey}_${mesaNumber}`;
            const totalDivipol = divipolMap[divipolKey] || 0;

            // Calcular porcentajes vs DIVIPOLE
            const porcentajeRegistradoVsDivipol =
              totalDivipol > 0
                ? ((totalRegistrado / totalDivipol) * 100).toFixed(2)
                : '0.00';
            const porcentajeVotadoVsDivipol =
              totalDivipol > 0
                ? ((totalVotado / totalDivipol) * 100).toFixed(2)
                : '0.00';

            return {
              mesa,
              totalRegistrado,
              totalVotado,
              totalDivipol,
              porcentajeRegistradoVsDivipol,
              porcentajeVotadoVsDivipol,
            };
          },
        );

        // Calcular totalPuesto como suma de todos los totalRegistrado
        const totalPuesto = mesasArray.reduce(
          (sum, mesa) => sum + mesa.totalRegistrado,
          0,
        );

        return {
          departamento: booth.departamento,
          municipio: booth.municipio,
          puestoVotacion: booth.puestoVotacion,
          totalPuesto,
          mesas: mesasArray,
        };
      },
    );

    // Ordenar por departamento, municipio, puesto
    result.sort((a, b) => {
      if (a.departamento !== b.departamento) {
        return a.departamento.localeCompare(b.departamento);
      }
      if (a.municipio !== b.municipio) {
        return a.municipio.localeCompare(b.municipio);
      }
      return a.puestoVotacion.localeCompare(b.puestoVotacion);
    });

    // Ordenar mesas dentro de cada puesto
    result.forEach((booth) => {
      booth.mesas.sort((a, b) => {
        // Extraer el número de la mesa (ej: "Mesa 1" -> 1)
        const numA = parseInt(a.mesa.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.mesa.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
    });

    return result;
  }
}
