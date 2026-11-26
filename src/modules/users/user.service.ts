import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Optional,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { CampaignUser } from '../../database/entities/campaign-user.entity';
import { Role } from '../../database/entities/role.entity';
import { Campaign } from '../../database/entities/campaigns.entity';
import { WitnessTableAssignment } from '../../database/entities/witness-table-assignment.entity';
import { VotingBooth } from '../../database/entities/voting-booth.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CacheService } from '../../common/cache/cache.service';

const CAMPAIGN_SCOPED_ROLE_IDS = new Set([7, 8]); // Director de campaña, Testigo electoral
const WITNESS_ROLE_ID = 8;
const CAN_MANAGE_WITNESS_MESA_ROLE_IDS = new Set([1, 2]); // Superadmin, Admin de campaña

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CampaignUser)
    private readonly campaignUserRepository: Repository<CampaignUser>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(WitnessTableAssignment)
    private readonly witnessAssignmentRepository: Repository<WitnessTableAssignment>,
    @InjectRepository(VotingBooth)
    private readonly votingBoothRepository: Repository<VotingBooth>,
    @Optional()
    private readonly cacheService?: CacheService,
  ) {}

  private isCampaignScopedRole(roleId?: number | null): boolean {
    return !!roleId && CAMPAIGN_SCOPED_ROLE_IDS.has(roleId);
  }

  async assertCanCreateUserWithRole(
    authenticatedRoleId: number | undefined,
    targetRoleId: number | undefined,
  ): Promise<void> {
    if (!targetRoleId) {
      return;
    }

    const normalizedTargetRoleId = Number(targetRoleId);

    // 7 = Director de campaña, 8 = Testigo electoral
    const restrictedTargetRoleIds = new Set([7, 8]);
    if (!restrictedTargetRoleIds.has(normalizedTargetRoleId)) {
      return;
    }

    const targetRole = await this.roleRepository.findOne({
      where: { id: normalizedTargetRoleId },
    });

    if (!targetRole) {
      throw new NotFoundException(
        `Role with ID ${normalizedTargetRoleId} not found`,
      );
    }

    // Validar por ID (no por nombre): en BD el rol 2 puede tener "ñ" corrupta
    // 1 = Superadmin, 2 = Admin de campaña
    const allowedCreatorRoleIds = new Set([1, 2]);
    const creatorRoleId = Number(authenticatedRoleId);

    if (!allowedCreatorRoleIds.has(creatorRoleId)) {
      throw new ForbiddenException(
        'No tiene permisos para realizar esta operación',
      );
    }
  }

  /**
   * Director (7) y Testigo (8) deben pertenecer a exactamente una campaña.
   * Al cambiar de campaña se reemplaza la asignación previa.
   */
  private async assertValidCampaignAssignment(params: {
    roleId?: number | null;
    campaignIds?: number[];
    organizationId?: number | null;
    authenticatedUser?: { roleId?: number; organizationId?: number | null };
    required: boolean;
  }): Promise<number[] | undefined> {
    const { roleId, campaignIds, organizationId, authenticatedUser, required } =
      params;

    if (!this.isCampaignScopedRole(roleId)) {
      return campaignIds;
    }

    if (!campaignIds || campaignIds.length === 0) {
      if (required) {
        throw new BadRequestException(
          'Director de campaña y Testigo electoral deben asignarse a exactamente una campaña',
        );
      }
      return campaignIds;
    }

    if (campaignIds.length !== 1) {
      throw new BadRequestException(
        'Director de campaña y Testigo electoral solo pueden pertenecer a una campaña',
      );
    }

    const uniqueCampaignIds = [...new Set(campaignIds)];
    const campaigns = await this.campaignRepository.find({
      where: { id: In(uniqueCampaignIds) },
    });

    if (campaigns.length !== uniqueCampaignIds.length) {
      throw new NotFoundException('Una o más campañas indicadas no existen');
    }

    const targetOrganizationId =
      authenticatedUser?.organizationId ?? organizationId ?? null;

    if (targetOrganizationId) {
      const invalidCampaign = campaigns.find(
        (campaign) => campaign.organizationId !== targetOrganizationId,
      );
      if (invalidCampaign) {
        throw new ForbiddenException(
          'La campaña asignada no pertenece a la organización del usuario',
        );
      }
    }

    // Admin de campaña solo puede asignar campañas de su organización
    if (authenticatedUser?.roleId === 2) {
      if (!authenticatedUser.organizationId) {
        throw new ForbiddenException(
          'El Admin de campaña debe pertenecer a una organización',
        );
      }
      const outsideOrg = campaigns.find(
        (campaign) =>
          campaign.organizationId !== authenticatedUser.organizationId,
      );
      if (outsideOrg) {
        throw new ForbiddenException(
          'Solo puedes asignar campañas de tu organización',
        );
      }
    }

    return uniqueCampaignIds;
  }

  async getAssignedCampaignIds(userId: number): Promise<number[]> {
    const assignments = await this.campaignUserRepository.find({
      where: { userId },
      select: ['campaignId'],
    });
    return assignments.map((assignment) => assignment.campaignId);
  }

  private mapTableAssignment(assignment?: WitnessTableAssignment | null) {
    if (!assignment) {
      return null;
    }

    const booth = assignment.votingBooth as
      | (VotingBooth & {
          municipality?: {
            id?: number;
            name?: string;
            departmentId?: number;
            department?: { id?: number; name?: string };
          };
        })
      | undefined;

    return {
      campaignId: assignment.campaignId,
      votingBoothId: assignment.votingBoothId,
      votingBoothName: booth?.name ?? null,
      votingBoothCode: booth?.code ?? null,
      tableNumber: assignment.tableNumber,
      municipalityId: booth?.municipalityId ?? booth?.municipality?.id ?? null,
      municipalityName: booth?.municipality?.name ?? null,
      departmentId:
        booth?.municipality?.departmentId ??
        booth?.municipality?.department?.id ??
        null,
      departmentName: booth?.municipality?.department?.name ?? null,
    };
  }

  /**
   * Respuesta pública sin password ni campos redundantes de campaign_users.
   */
  private toPublicUser(
    user: User,
    tableAssignment?: WitnessTableAssignment | null,
  ) {
    const {
      password: _password,
      campaignUsers,
      ...rest
    } = user as User & {
      password?: string;
    };

    const campaigns = (campaignUsers || []).map((assignment) => ({
      id: assignment.campaign?.id ?? assignment.campaignId,
      name: assignment.campaign?.name ?? null,
      description: assignment.campaign?.description ?? null,
      startDate: assignment.campaign?.startDate ?? null,
      endDate: assignment.campaign?.endDate ?? null,
      status: assignment.campaign?.status ?? null,
      organizationId: assignment.campaign?.organizationId ?? null,
    }));

    return {
      ...rest,
      campaigns,
      tableAssignment: this.mapTableAssignment(tableAssignment),
    };
  }

  private async loadTableAssignmentsByUserIds(userIds: number[]) {
    if (!userIds.length) {
      return new Map<number, WitnessTableAssignment>();
    }

    const assignments = await this.witnessAssignmentRepository.find({
      where: { userId: In(userIds) },
      relations: [
        'votingBooth',
        'votingBooth.municipality',
        'votingBooth.municipality.department',
        'campaign',
      ],
    });

    const map = new Map<number, WitnessTableAssignment>();
    for (const assignment of assignments) {
      // Un testigo tiene una mesa por campaña; nos quedamos con la más reciente
      const current = map.get(assignment.userId);
      if (!current || assignment.updatedAt > current.updatedAt) {
        map.set(assignment.userId, assignment);
      }
    }
    return map;
  }

  private async toPublicUsers(users: User[]) {
    const assignmentMap = await this.loadTableAssignmentsByUserIds(
      users.map((user) => user.id),
    );
    return users.map((user) =>
      this.toPublicUser(user, assignmentMap.get(user.id) ?? null),
    );
  }

  private async upsertWitnessTableAssignment(params: {
    userId: number;
    roleId?: number | null;
    campaignId: number;
    votingBoothId: number;
    tableNumber: number;
    authenticatedUser?: { roleId?: number; organizationId?: number | null };
  }) {
    const { userId, roleId, campaignId, votingBoothId, tableNumber } = params;

    if (roleId !== WITNESS_ROLE_ID) {
      throw new BadRequestException(
        'Solo se puede asignar mesa a un Testigo electoral',
      );
    }

    const creatorRoleId = Number(params.authenticatedUser?.roleId);
    if (!CAN_MANAGE_WITNESS_MESA_ROLE_IDS.has(creatorRoleId)) {
      throw new ForbiddenException(
        'No tiene permisos para realizar esta operación',
      );
    }

    await this.assertValidCampaignAssignment({
      roleId: WITNESS_ROLE_ID,
      campaignIds: [campaignId],
      organizationId: params.authenticatedUser?.organizationId ?? null,
      authenticatedUser: params.authenticatedUser,
      required: true,
    });

    const membership = await this.campaignUserRepository.findOne({
      where: { userId, campaignId },
    });
    if (!membership) {
      throw new ForbiddenException(
        'El testigo debe estar asignado a la campaña de la mesa',
      );
    }

    const booth = await this.votingBoothRepository.findOne({
      where: { id: votingBoothId },
    });
    if (!booth) {
      throw new NotFoundException('Puesto de votación no encontrado');
    }
    if (tableNumber < 1 || tableNumber > booth.mesas) {
      throw new BadRequestException(
        `El número de mesa debe estar entre 1 y ${booth.mesas}`,
      );
    }

    const existing = await this.witnessAssignmentRepository.findOne({
      where: { userId, campaignId },
    });

    if (existing) {
      existing.votingBoothId = votingBoothId;
      existing.tableNumber = tableNumber;
      return this.witnessAssignmentRepository.save(existing);
    }

    return this.witnessAssignmentRepository.save(
      this.witnessAssignmentRepository.create({
        userId,
        campaignId,
        votingBoothId,
        tableNumber,
      }),
    );
  }

  async create(
    createUserDto: CreateUserDto,
    authenticatedUser?: { roleId?: number; organizationId?: number | null },
  ): Promise<User> {
    const {
      campaignIds,
      organizationId,
      votingBoothId,
      tableNumber,
      ...userData
    } = createUserDto;

    const validatedCampaignIds = await this.assertValidCampaignAssignment({
      roleId: createUserDto.roleId,
      campaignIds,
      organizationId,
      authenticatedUser,
      required: true,
    });

    // Hash la contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const userCreateData: any = {
      ...userData,
      password: hashedPassword,
    };

    // Solo agregar organizationId si existe
    if (organizationId) {
      userCreateData.organizationId = organizationId;
    }

    const user = this.userRepository.create(userCreateData);
    const savedUser = await this.userRepository.save(user);

    // Asegurar que savedUser es un objeto, no un array
    const userIdToUse = (savedUser as any)?.id;

    if (
      validatedCampaignIds &&
      validatedCampaignIds.length > 0 &&
      userIdToUse
    ) {
      await this.replaceUserCampaigns(userIdToUse, validatedCampaignIds);
    }

    if (
      createUserDto.roleId === WITNESS_ROLE_ID &&
      userIdToUse &&
      validatedCampaignIds?.[0] &&
      votingBoothId != null &&
      tableNumber != null
    ) {
      await this.upsertWitnessTableAssignment({
        userId: userIdToUse,
        roleId: WITNESS_ROLE_ID,
        campaignId: validatedCampaignIds[0],
        votingBoothId,
        tableNumber,
        authenticatedUser,
      });
    }

    // Invalidar cache después de crear
    if (this.cacheService) {
      await this.cacheService.invalidate('users:all');
    }

    return (await this.findOnePublic(userIdToUse))! as any;
  }

  async findAll() {
    const load = async () => {
      const users = await this.userRepository.find({
        relations: ['campaignUsers', 'campaignUsers.campaign'],
      });
      return this.toPublicUsers(users);
    };

    if (this.cacheService) {
      return await this.cacheService.get('users:all', load, 1800);
    }

    return load();
  }

  async findByRole(roleId: number) {
    const load = async () => {
      const users = await this.userRepository.find({
        where: { roleId },
        relations: ['role', 'campaignUsers', 'campaignUsers.campaign'],
      });
      return this.toPublicUsers(users);
    };

    if (this.cacheService) {
      return await this.cacheService.get(`users:role:${roleId}`, load, 1800);
    }

    return load();
  }

  async findAllWithPagination(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const query = this.userRepository
      .createQueryBuilder('user')
      .select('user.id', 'id');

    if (search?.trim()) {
      query.where('LOWER(user.email) LIKE LOWER(:search)', {
        search: `%${search.trim()}%`,
      });
    }

    const total = await query.getCount();
    const idRows = await query
      .orderBy('user.id', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany<{ id: number }>();
    const ids = idRows.map((row) => Number(row.id));

    if (!ids.length) {
      return {
        data: [],
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 0,
      };
    }

    const users = await this.userRepository.find({
      where: { id: In(ids) },
      relations: ['role', 'campaignUsers', 'campaignUsers.campaign'],
    });
    const usersById = new Map(users.map((user) => [user.id, user]));
    const orderedUsers = ids
      .map((id) => usersById.get(id))
      .filter((user): user is User => !!user);

    return {
      data: await this.toPublicUsers(orderedUsers),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 0,
    };
  }

  async findByRoleWithPagination(
    roleId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    // 1) IDs únicos (evita duplicados por el join con campaign_users)
    const idsQuery = this.userRepository
      .createQueryBuilder('user')
      .select('user.id', 'id')
      .where('user.roleId = :roleId', { roleId });

    if (search && search.trim()) {
      idsQuery.andWhere('LOWER(user.email) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    const total = await idsQuery.getCount();
    const idRows = await idsQuery
      .orderBy('user.id', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany<{ id: number }>();

    const ids = idRows.map((row) => Number(row.id));

    if (ids.length === 0) {
      return {
        data: [],
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 0,
      };
    }

    // 2) Cargar relaciones solo de esos usuarios
    const users = await this.userRepository.find({
      where: { id: In(ids) },
      relations: ['role', 'campaignUsers', 'campaignUsers.campaign'],
      order: { id: 'DESC' },
    });

    // Mantener el orden de la página
    const usersById = new Map(users.map((user) => [user.id, user]));
    const orderedUsers = ids
      .map((id) => usersById.get(id))
      .filter((user): user is User => !!user);

    return {
      data: await this.toPublicUsers(orderedUsers),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 0,
    };
  }

  async findOne(id: number): Promise<User | null> {
    if (this.cacheService) {
      return await this.cacheService.get(
        `user:${id}`,
        () =>
          this.userRepository.findOne({
            where: { id },
            relations: ['role', 'campaignUsers', 'campaignUsers.campaign'],
          }),
        1800,
      );
    }

    return await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'campaignUsers', 'campaignUsers.campaign'],
    });
  }

  async findOnePublic(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      return null;
    }
    const assignmentMap = await this.loadTableAssignmentsByUserIds([user.id]);
    return this.toPublicUser(user, assignmentMap.get(user.id) ?? null);
  }

  async findByEmail(email: string): Promise<User | null> {
    if (this.cacheService) {
      return await this.cacheService.get(
        `user:email:${email}`,
        () =>
          this.userRepository.findOne({
            where: { email },
            relations: ['role', 'campaignUsers', 'campaignUsers.campaign'],
          }),
        300, // Menos tiempo para emails (pueden cambiar)
      );
    }

    return await this.userRepository.findOne({
      where: { email },
      relations: ['role', 'campaignUsers', 'campaignUsers.campaign'],
    });
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    authenticatedUser?: { roleId?: number; organizationId?: number | null },
  ): Promise<User | null> {
    const existingUser = await this.findOne(id);
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { campaignIds, votingBoothId, tableNumber, ...userData } =
      updateUserDto;

    const validatedCampaignIds = await this.assertValidCampaignAssignment({
      roleId: existingUser.roleId,
      campaignIds,
      organizationId: existingUser.organizationId,
      authenticatedUser,
      required: false,
    });

    // Si se actualiza la contraseña, hashearla
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    await this.userRepository.update(id, userData);

    if (validatedCampaignIds && validatedCampaignIds.length > 0) {
      // Reemplazo total: al cambiar de campaña pierde acceso a la anterior
      await this.replaceUserCampaigns(id, validatedCampaignIds);
    }

    const wantsMesaUpdate = votingBoothId != null || tableNumber != null;
    if (wantsMesaUpdate) {
      if (existingUser.roleId !== WITNESS_ROLE_ID) {
        throw new BadRequestException(
          'Solo se puede cambiar la mesa de un Testigo electoral',
        );
      }
      if (votingBoothId == null || tableNumber == null) {
        throw new BadRequestException(
          'Para cambiar la mesa debes enviar votingBoothId y tableNumber',
        );
      }

      const campaignId =
        validatedCampaignIds?.[0] ?? (await this.getAssignedCampaignIds(id))[0];

      if (!campaignId) {
        throw new BadRequestException(
          'El testigo debe tener una campaña asignada para cambiarle la mesa',
        );
      }

      await this.upsertWitnessTableAssignment({
        userId: id,
        roleId: existingUser.roleId,
        campaignId,
        votingBoothId,
        tableNumber,
        authenticatedUser,
      });
    }

    // Invalidar cache
    if (this.cacheService) {
      await this.cacheService.invalidate(`user:${id}`);
      await this.cacheService.invalidate('users:all');
      // Invalidar por roleId si existe
      const user = await this.findOne(id);
      if (user?.roleId) {
        await this.cacheService.invalidate(`users:role:${user.roleId}`);
      }
    }

    return (await this.findOnePublic(id)) as any;
  }

  async updatePassword(id: number, hashedPassword: string): Promise<void> {
    await this.userRepository.update(id, { password: hashedPassword });

    if (this.cacheService) {
      await this.cacheService.invalidate(`user:${id}`);
      await this.cacheService.invalidate('users:all');
    }
  }

  async changeOwnPassword(
    userId: number,
    newPassword: string,
  ): Promise<User | null> {
    const user = await this.findOne(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userRepository.update(userId, { password: hashedPassword });

    if (this.cacheService) {
      await this.cacheService.invalidate(`user:${userId}`);
      await this.cacheService.invalidate('users:all');
      if (user.roleId) {
        await this.cacheService.invalidate(`users:role:${user.roleId}`);
      }
    }

    return (await this.findOnePublic(userId)) as any;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.delete(id);

    if (this.cacheService) {
      await this.cacheService.invalidate(`user:${id}`);
      await this.cacheService.invalidate('users:all');
      if (user?.roleId) {
        await this.cacheService.invalidate(`users:role:${user.roleId}`);
      }
    }
  }

  async replaceUserCampaigns(userId: number, campaignIds: number[]) {
    await this.campaignUserRepository.delete({ userId });
    const saved = await this.assignUserToCampaigns(userId, campaignIds);

    // Si cambia de campaña, pierde la mesa asignada de campañas previas
    if (campaignIds.length > 0) {
      await this.witnessAssignmentRepository
        .createQueryBuilder()
        .delete()
        .where('"userId" = :userId', { userId })
        .andWhere('"campaignId" NOT IN (:...campaignIds)', { campaignIds })
        .execute();
    } else {
      await this.witnessAssignmentRepository.delete({ userId });
    }

    return saved;
  }

  async assignUserToCampaigns(userId: number, campaignIds: number[]) {
    const campaignUsers = campaignIds.map((campaignId) =>
      this.campaignUserRepository.create({
        userId,
        campaignId,
      }),
    );
    return await this.campaignUserRepository.save(campaignUsers);
  }

  /**
   * Asigna campaña(s). Para Director/Testigo reemplaza la asignación previa
   * y solo permite una campaña, para que no vean datos de campañas anteriores.
   */
  async assignUserToCampaign(
    userId: number,
    campaignId: number,
    authenticatedUser?: { roleId?: number; organizationId?: number | null },
  ) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (this.isCampaignScopedRole(user.roleId)) {
      const validatedCampaignIds = await this.assertValidCampaignAssignment({
        roleId: user.roleId,
        campaignIds: [campaignId],
        organizationId: user.organizationId,
        authenticatedUser,
        required: true,
      });

      await this.replaceUserCampaigns(userId, validatedCampaignIds!);

      if (this.cacheService) {
        await this.cacheService.invalidate(`user:${userId}`);
        await this.cacheService.invalidate('users:all');
        if (user.roleId) {
          await this.cacheService.invalidate(`users:role:${user.roleId}`);
        }
      }

      return this.findOnePublic(userId);
    }

    return this.assignUserToCampaigns(userId, [campaignId]);
  }

  async removeUserFromCampaign(userId: number, campaignId: number) {
    const user = await this.findOne(userId);
    if (user && this.isCampaignScopedRole(user.roleId)) {
      throw new BadRequestException(
        'Director de campaña y Testigo electoral deben conservar una campaña asignada. Reasigna otra campaña en su lugar.',
      );
    }

    return await this.campaignUserRepository.delete({
      userId,
      campaignId,
    });
  }
}
