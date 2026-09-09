import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../../database/entities/campaigns.entity';
import { CampaignUser } from '../../database/entities/campaign-user.entity';
import { User } from '../../database/entities/user.entity';
import { Candidate } from '../../database/entities/candidate.entity';
import { Leader } from '../../database/entities/leader.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
    @InjectRepository(CampaignUser)
    private campaignUserRepository: Repository<CampaignUser>,
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    @InjectRepository(Leader)
    private leaderRepository: Repository<Leader>,
    @Optional()
    private readonly cacheService?: CacheService,
  ) {}

  /**
   * Crear una nueva campaña
   */
  async create(createCampaignDto: CreateCampaignDto, currentUser: User) {
    const { userIds, organizationId, ...campaignData } = createCampaignDto;

    let finalOrganizationId: number;

    // Caso 1: Usuario es admin de organización
    // La campaña se asigna automáticamente a su organización
    if (currentUser.organizationId) {
      finalOrganizationId = currentUser.organizationId;
    }
    // Caso 2: Usuario es super admin pero proporciona organizationId
    else if (organizationId) {
      finalOrganizationId = organizationId;
    }
    // Caso 3: Usuario es super admin pero no proporciona organizationId
    else {
      throw new BadRequestException(
        'Como super admin, debes proporcionar organizationId para crear una campaña',
      );
    }

    // Validar fechas
    const startDate = new Date(campaignData.startDate);
    const endDate = new Date(campaignData.endDate);
    if (startDate > endDate) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser mayor que la fecha de fin',
      );
    }

    // Crear objeto para la campaña
    const campaignPayload: any = {
      ...campaignData,
      organizationId: finalOrganizationId,
    };

    const campaign = this.campaignsRepository.create(campaignPayload);
    const savedCampaign = await this.campaignsRepository.save(campaign);

    // Asegurar que savedCampaign es un objeto, no un array
    const campaignId = Array.isArray(savedCampaign)
      ? (savedCampaign[0] as any).id
      : (savedCampaign as any).id;

    if (!campaignId) {
      throw new BadRequestException('Error al crear la campaña');
    }

    if (userIds && userIds.length > 0) {
      await this.assignUsersTooCampaign(campaignId, userIds, currentUser);
    }

    if (this.cacheService) {
      await this.cacheService.invalidateByPattern('campaigns:*');
    }

    return await this.findOneBasic(campaignId, currentUser);
  }

  /**
   * Obtener todas las campañas con paginación
   * ✅ FILTRA AUTOMÁTICAMENTE POR ORGANIZACIÓN DEL USUARIO
   */
  async findAll(
    currentUser: User,
    page: number = 1,
    limit: number = 10,
    search: string = '',
  ) {
    if (this.cacheService && !search) {
      const cacheKey = currentUser.organizationId
        ? `campaigns:org:${currentUser.organizationId}:${page}:${limit}`
        : `campaigns:all:${page}:${limit}`;
      return await this.cacheService.get(
        cacheKey,
        () => this.executeFindAll(currentUser, page, limit, search),
        1800,
      );
    }
    return await this.executeFindAll(currentUser, page, limit, search);
  }

  private async executeFindAll(
    currentUser: User,
    page: number = 1,
    limit: number = 10,
    search: string = '',
  ) {
    try {
      const skip = (page - 1) * limit;

      const query = this.campaignsRepository.createQueryBuilder('campaign');

      // ✅ FILTRO: Solo aplica si el usuario tiene organizationId (admin de organización)
      // El super admin (sin organizationId) ve TODAS las campañas sin restricción
      if (currentUser.organizationId) {
        query.where('campaign.organizationId = :organizationId', {
          organizationId: currentUser.organizationId,
        });
      }

      // Agregar búsqueda si existe
      if (search && search.trim()) {
        query.andWhere(
          '(campaign.name ILIKE :search OR campaign.description ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Agregar relaciones
      query
        .leftJoinAndSelect('campaign.organization', 'organization')
        .leftJoinAndSelect('campaign.campaignUsers', 'campaignUsers')
        .leftJoinAndSelect('campaignUsers.user', 'user')
        .orderBy('campaign.createdAt', 'DESC')
        .skip(skip)
        .take(limit);

      const [data, total] = await query.getManyAndCount();

      const pages = Math.ceil(total / limit);

      return {
        data,
        page,
        limit,
        total,
        pages,
      };
    } catch (error) {
      console.error('Error en findAll:', error);
      throw new InternalServerErrorException(
        'Error al obtener campañas: ' + error.message,
      );
    }
  }

  /**
   * Obtener campaña del usuario autenticado
   * ✅ FILTRA AUTOMÁTICAMENTE POR ORGANIZACIÓN
   */
  async findByUser(currentUser: User) {
    if (this.cacheService) {
      const cacheKey = currentUser.organizationId
        ? `campaigns:byuser:${currentUser.organizationId}`
        : `campaigns:byuser:all`;
      return await this.cacheService.get(
        cacheKey,
        () => this.executeFindByUser(currentUser),
        1800,
      );
    }
    return await this.executeFindByUser(currentUser);
  }

  private async executeFindByUser(currentUser: User) {
    try {
      const query = this.campaignsRepository.createQueryBuilder('campaign');

      // ✅ FILTRO: Solo aplica si el usuario tiene organizationId (admin de organización)
      // El super admin (sin organizationId) ve TODAS las campañas sin restricción
      if (currentUser.organizationId) {
        query.where('campaign.organizationId = :organizationId', {
          organizationId: currentUser.organizationId,
        });
      }

      query
        .leftJoinAndSelect('campaign.organization', 'organization')
        .leftJoinAndSelect('campaign.campaignUsers', 'campaignUsers')
        .leftJoinAndSelect('campaignUsers.user', 'user')
        .orderBy('campaign.createdAt', 'DESC');

      return await query.getMany();
    } catch (error) {
      console.error('Error en findByUser:', error);
      throw new InternalServerErrorException(
        'Error al obtener campañas del usuario: ' + error.message,
      );
    }
  }

  /**
   * Obtener campaña básica sin candidatos y líderes (para crear/actualizar)
   * ✅ VALIDA QUE LA CAMPAÑA PERTENEZCA A LA ORGANIZACIÓN DEL USUARIO
   */
  async findOneBasic(id: number, currentUser?: User) {
    if (this.cacheService) {
      return await this.cacheService.get(
        `campaigns:basic:${id}`,
        () => this.executeFindOneBasic(id, currentUser),
        1800,
      );
    }
    return await this.executeFindOneBasic(id, currentUser);
  }

  private async executeFindOneBasic(id: number, currentUser?: User) {
    try {
      const query = this.campaignsRepository
        .createQueryBuilder('campaign')
        .leftJoinAndSelect('campaign.organization', 'organization')
        .leftJoinAndSelect('campaign.campaignUsers', 'campaignUsers')
        .leftJoinAndSelect('campaignUsers.user', 'user')
        .where('campaign.id = :id', { id });

      const campaign = await query.getOne();

      if (!campaign) {
        throw new NotFoundException(`Campaña con ID ${id} no encontrada`);
      }

      // ✅ VALIDACIÓN OBLIGATORIA: Si el usuario tiene organizationId,
      // verifica que la campaña pertenezca a su organización
      if (currentUser && currentUser.organizationId) {
        if (campaign.organizationId !== currentUser.organizationId) {
          throw new ForbiddenException(
            'No tienes permiso para acceder a esta campaña. Pertenece a otra organización.',
          );
        }
      }

      return campaign;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Error en findOneBasic:', error);
      throw new InternalServerErrorException(
        'Error al obtener la campaña: ' + error.message,
      );
    }
  }

  /**
   * Obtener campaña por ID con todas sus relaciones
   * ✅ VALIDA ACCESO POR ORGANIZACIÓN
   */
  async findOne(id: number, currentUser?: User) {
    if (this.cacheService) {
      return await this.cacheService.get(
        `campaigns:full:${id}`,
        () => this.executeFindOne(id, currentUser),
        1800,
      );
    }
    return await this.executeFindOne(id, currentUser);
  }

  private async executeFindOne(id: number, currentUser?: User) {
    try {
      // Primero obtener la campaña básica con validación de organización
      const campaign = await this.executeFindOneBasic(id, currentUser);

      // Luego cargar candidatos y líderes por separado con try-catch
      try {
        const candidates = await this.candidateRepository.find({
          where: { campaignId: id },
        });
        campaign.candidates = candidates;
      } catch (candError) {
        console.warn(
          `Warning: No se pudieron cargar candidatos para campaña ${id}:`,
          candError.message,
        );
        campaign.candidates = [];
      }

      try {
        const leaders = await this.leaderRepository.find({
          where: { campaignId: id },
        });
        campaign.leaders = leaders;
      } catch (leadError) {
        console.warn(
          `Warning: No se pudieron cargar líderes para campaña ${id}:`,
          leadError.message,
        );
        campaign.leaders = [];
      }

      return campaign;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Error en findOne:', error);
      throw new InternalServerErrorException(
        'Error al obtener la campaña: ' + error.message,
      );
    }
  }

  /**
   * Obtener campañas por organización
   * ✅ VALIDA QUE EL USUARIO TENGA ACCESO
   */
  async findByOrganization(organizationId: number, currentUser: User) {
    if (this.cacheService) {
      return await this.cacheService.get(
        `campaigns:org:${organizationId}`,
        () => this.executeFindByOrganization(organizationId, currentUser),
        1800,
      );
    }
    return await this.executeFindByOrganization(organizationId, currentUser);
  }

  private async executeFindByOrganization(
    organizationId: number,
    currentUser: User,
  ) {
    try {
      // ✅ VALIDACIÓN: Si el usuario es admin de organización,
      // solo puede ver sus propias campañas
      if (currentUser.organizationId) {
        if (organizationId !== currentUser.organizationId) {
          throw new ForbiddenException(
            'Solo puedes ver las campañas de tu organización',
          );
        }
      }

      return await this.campaignsRepository.find({
        where: { organizationId },
        relations: ['organization', 'campaignUsers', 'campaignUsers.user'],
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Error en findByOrganization:', error);
      throw new InternalServerErrorException(
        'Error al obtener campañas de la organización: ' + error.message,
      );
    }
  }

  /**
   * Actualizar campaña
   * ✅ VALIDA ACCESO POR ORGANIZACIÓN
   */
  async update(
    id: number,
    updateCampaignDto: UpdateCampaignDto,
    currentUser: User,
  ) {
    try {
      const { userIds, ...campaignData } = updateCampaignDto;

      // ✅ Valida que el usuario tenga acceso a esta campaña
      const campaign = await this.findOneBasic(id, currentUser);

      // Validar fechas si se actualizan
      if (campaignData.startDate && campaignData.endDate) {
        const startDate = new Date(campaignData.startDate);
        const endDate = new Date(campaignData.endDate);
        if (startDate > endDate) {
          throw new BadRequestException(
            'La fecha de inicio no puede ser mayor que la fecha de fin',
          );
        }
      }

      Object.assign(campaign, campaignData);
      await this.campaignsRepository.save(campaign);

      if (userIds && userIds.length > 0) {
        // Eliminar asignaciones previas
        await this.campaignUserRepository.delete({ campaignId: id });
        // Asignar nuevos usuarios
        await this.assignUsersTooCampaign(id, userIds, currentUser);
      }

      if (this.cacheService) {
        await this.cacheService.invalidate(`campaigns:basic:${id}`);
        await this.cacheService.invalidate(`campaigns:full:${id}`);
        await this.cacheService.invalidateByPattern('campaigns:*');
      }

      return await this.findOneBasic(id, currentUser);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error en update:', error);
      throw new InternalServerErrorException(
        'Error al actualizar la campaña: ' + error.message,
      );
    }
  }

  /**
   * Eliminar campaña
   * ✅ VALIDA ACCESO POR ORGANIZACIÓN
   */
  async remove(id: number, currentUser: User) {
    try {
      // ✅ Valida que el usuario tenga acceso a esta campaña
      const campaign = await this.findOneBasic(id, currentUser);

      // Eliminar asignaciones de usuarios antes de eliminar la campaña
      await this.campaignUserRepository.delete({ campaignId: id });

      const result = await this.campaignsRepository.remove(campaign);

      if (this.cacheService) {
        await this.cacheService.invalidate(`campaigns:basic:${id}`);
        await this.cacheService.invalidate(`campaigns:full:${id}`);
        await this.cacheService.invalidateByPattern('campaigns:*');
      }

      return result;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Error en remove:', error);
      throw new InternalServerErrorException(
        'Error al eliminar la campaña: ' + error.message,
      );
    }
  }

  /**
   * Asignar usuarios a una campaña
   * ✅ VALIDA ACCESO POR ORGANIZACIÓN
   */
  async assignUsersTooCampaign(
    campaignId: number,
    userIds: number[],
    currentUser: User,
  ) {
    try {
      // ✅ Valida que la campaña existe y el usuario tiene acceso
      const campaign = await this.findOneBasic(campaignId, currentUser);

      if (!campaign) {
        throw new NotFoundException(
          `Campaña con ID ${campaignId} no encontrada`,
        );
      }

      // Validar que no haya duplicados
      const existingAssignments = await this.campaignUserRepository.find({
        where: { campaignId },
      });

      const existingUserIds = existingAssignments.map((cu) => cu.userId);
      const newUserIds = userIds.filter((id) => !existingUserIds.includes(id));

      if (newUserIds.length === 0) {
        throw new BadRequestException(
          'Todos los usuarios ya están asignados a esta campaña',
        );
      }

      const campaignUsers = newUserIds.map((userId) =>
        this.campaignUserRepository.create({
          campaignId,
          userId,
        }),
      );

      return await this.campaignUserRepository.save(campaignUsers);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error en assignUsersTooCampaign:', error);
      throw new InternalServerErrorException(
        'Error al asignar usuarios a la campaña: ' + error.message,
      );
    }
  }

  /**
   * Remover usuario de una campaña
   * ✅ VALIDA ACCESO POR ORGANIZACIÓN
   */
  async removeUserFromCampaign(
    campaignId: number,
    userId: number,
    currentUser: User,
  ) {
    try {
      // ✅ Valida que la campaña existe y el usuario tiene acceso
      await this.findOneBasic(campaignId, currentUser);

      const campaignUser = await this.campaignUserRepository.findOne({
        where: { campaignId, userId },
      });

      if (!campaignUser) {
        throw new NotFoundException(
          `Usuario ${userId} no está asignado a la campaña ${campaignId}`,
        );
      }

      await this.campaignUserRepository.delete({
        campaignId,
        userId,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Error en removeUserFromCampaign:', error);
      throw new InternalServerErrorException(
        'Error al remover usuario de la campaña: ' + error.message,
      );
    }
  }
}
