import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Organization } from '../../database/entities/organizations.entity';
import { User } from '../../database/entities/user.entity';
import { Campaign } from '../../database/entities/campaigns.entity';
import { Candidate } from '../../database/entities/candidate.entity';
import { Leader } from '../../database/entities/leader.entity';
import { CampaignUser } from '../../database/entities/campaign-user.entity';
import { CandidateVoter } from '../../database/entities/candidate-voter.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateOrganizationWithAdminDto } from './dto/create-organization-with-admin.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    @InjectRepository(Leader)
    private leaderRepository: Repository<Leader>,
    @InjectRepository(CampaignUser)
    private campaignUserRepository: Repository<CampaignUser>,
    @InjectRepository(CandidateVoter)
    private candidateVoterRepository: Repository<CandidateVoter>,
    @Optional()
    private readonly cacheService?: CacheService,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto) {
    const organization = this.organizationsRepository.create(
      createOrganizationDto,
    );
    const result = await this.organizationsRepository.save(organization);

    if (this.cacheService) {
      await this.cacheService.invalidate('organizations:all');
    }

    return result;
  }

  async createOrganizationWithAdmin(
    createOrganizationWithAdminDto: CreateOrganizationWithAdminDto,
  ) {
    const { adminEmail, adminPassword, adminRoleId, name, description } =
      createOrganizationWithAdminDto;

    console.log('Validando email:', adminEmail); // DEBUG

    // Validar que el email NO exista
    const existingUser = await this.usersRepository.findOne({
      where: { email: adminEmail.toLowerCase() },
    });

    console.log('Usuario existente:', existingUser); // DEBUG

    if (existingUser) {
      throw new BadRequestException(
        'El email del administrador ya está registrado',
      );
    }

    // Crear la organización
    const organization = this.organizationsRepository.create({
      name,
      description,
    });
    const savedOrganization =
      await this.organizationsRepository.save(organization);

    console.log('Organización creada:', savedOrganization.id); // DEBUG

    try {
      // Hash de la contraseña
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      // Crear el usuario administrador
      const adminUserData = {
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        organizationId: savedOrganization.id,
        roleId: adminRoleId,
      };

      const adminUser = this.usersRepository.create(adminUserData);
      const savedAdmin = await this.usersRepository.save(adminUser);

      console.log('Admin usuario creado:', savedAdmin.id); // DEBUG

      if (this.cacheService) {
        await this.cacheService.invalidate('organizations:all');
      }

      return {
        organization: savedOrganization,
        admin: {
          id: savedAdmin.id,
          email: savedAdmin.email,
        },
      };
    } catch (error) {
      // Si hay error al crear el usuario, elimina la organización
      await this.organizationsRepository.remove(savedOrganization);
      console.error('Error creando admin:', error);
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    if (this.cacheService && !search) {
      return await this.cacheService.get(
        `organizations:list:${page}:${limit}`,
        () => this.executeFindAll(page, limit, search),
        3600,
      );
    }
    return await this.executeFindAll(page, limit, search);
  }

  private async executeFindAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const query =
      this.organizationsRepository.createQueryBuilder('organization');

    if (search) {
      query.where(
        'organization.name ILIKE :search OR organization.description ILIKE :search',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await query
      .leftJoinAndSelect('organization.campaigns', 'campaigns')
      .leftJoinAndSelect('organization.users', 'users')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const pages = Math.ceil(total / limit);

    return {
      data,
      page,
      pages,
      total,
    };
  }

  async findOne(id: number) {
    if (this.cacheService) {
      return await this.cacheService.get(
        `organizations:${id}`,
        () => this.executeFindOne(id),
        3600,
      );
    }
    return await this.executeFindOne(id);
  }

  private async executeFindOne(id: number) {
    const organization = await this.organizationsRepository.findOne({
      where: { id },
      relations: ['campaigns', 'users'],
    });

    if (!organization) {
      throw new NotFoundException(`Organización con ID ${id} no encontrada`);
    }

    return organization;
  }

  async update(id: number, updateOrganizationDto: UpdateOrganizationDto) {
    const organization = await this.findOne(id);
    Object.assign(organization, updateOrganizationDto);
    const result = await this.organizationsRepository.save(organization);

    if (this.cacheService) {
      await this.cacheService.invalidate(`organizations:${id}`);
      await this.cacheService.invalidateByPattern('organizations:list:*');
    }

    return result;
  }

  async remove(id: number) {
    const organization = await this.findOne(id);

    try {
      // 1. Obtener todos los candidatos de las campañas de la organización
      const candidates = await this.candidateRepository.find({
        relations: ['campaign'],
        where: {
          campaign: {
            organizationId: id,
          },
        },
      });

      // 2. Eliminar todas las relaciones candidato-votante de estos candidatos
      if (candidates.length > 0) {
        const candidateIds = candidates.map((c) => c.id);
        await this.candidateVoterRepository.delete({
          candidateId: In(candidateIds),
        });
      }

      // 3. Obtener todos los líderes de las campañas de la organización
      const leaders = await this.leaderRepository.find({
        relations: ['campaign'],
        where: {
          campaign: {
            organizationId: id,
          },
        },
      });

      // 4. Obtener todas las campañas de la organización
      const campaigns = await this.campaignRepository.find({
        where: { organizationId: id },
      });

      // 5. Eliminar todas las relaciones campaña-usuario
      if (campaigns.length > 0) {
        const campaignIds = campaigns.map((c) => c.id);
        await this.campaignUserRepository.delete({
          campaign: { id: In(campaignIds) },
        });
      }

      // 6. Eliminar todos los candidatos
      if (candidates.length > 0) {
        await this.candidateRepository.remove(candidates);
      }

      // 7. Eliminar todos los líderes
      if (leaders.length > 0) {
        await this.leaderRepository.remove(leaders);
      }

      // 8. Eliminar todas las campañas
      if (campaigns.length > 0) {
        await this.campaignRepository.remove(campaigns);
      }

      // 9. Eliminar todos los usuarios de la organización
      const users = await this.usersRepository.find({
        where: { organizationId: id },
      });

      if (users.length > 0) {
        await this.usersRepository.remove(users);
      }

      // 10. Finalmente, eliminar la organización
      const result = await this.organizationsRepository.remove(organization);

      if (this.cacheService) {
        await this.cacheService.invalidate(`organizations:${id}`);
        await this.cacheService.invalidateByPattern('organizations:list:*');
      }

      return result;
    } catch (error) {
      throw new BadRequestException(
        `Error al eliminar la organización: ${error.message}`,
      );
    }
  }
}
