import { Injectable, Optional, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { CampaignUser } from '../../database/entities/campaign-user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CampaignUser)
    private readonly campaignUserRepository: Repository<CampaignUser>,
    @Optional()
    private readonly cacheService?: CacheService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { campaignIds, organizationId, ...userData } = createUserDto;

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

    if (campaignIds && campaignIds.length > 0 && userIdToUse) {
      await this.assignUserToCampaigns(userIdToUse, campaignIds);
    }

    // Invalidar cache después de crear
    if (this.cacheService) {
      await this.cacheService.invalidate('users:all');
    }

    return (await this.findOne(userIdToUse))!;
  }

  async findAll(): Promise<User[]> {
    if (this.cacheService) {
      return await this.cacheService.get(
        'users:all',
        () =>
          this.userRepository.find({
            relations: ['campaignUsers', 'campaignUsers.campaign'],
          }),
        1800, // 30 minutos
      );
    }

    return await this.userRepository.find({
      relations: ['campaignUsers', 'campaignUsers.campaign'],
    });
  }

  async findByRole(roleId: number): Promise<User[]> {
    if (this.cacheService) {
      return await this.cacheService.get(
        `users:role:${roleId}`,
        () =>
          this.userRepository.find({
            where: { roleId },
            relations: ['role', 'campaignUsers', 'campaignUsers.campaign'],
          }),
        1800,
      );
    }

    return await this.userRepository.find({
      where: { roleId },
      relations: ['role', 'campaignUsers', 'campaignUsers.campaign'],
    });
  }

  async findByRoleWithPagination(
    roleId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.campaignUsers', 'campaignUsers')
      .leftJoinAndSelect('campaignUsers.campaign', 'campaign')
      .where('user.roleId = :roleId', { roleId });

    if (search && search.trim()) {
      query.andWhere('LOWER(user.email) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    const [users, total] = await query.skip(skip).take(limit).getManyAndCount();

    return {
      data: users,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
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

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User | null> {
    const { campaignIds, ...userData } = updateUserDto;

    // Si se actualiza la contraseña, hashearla
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    await this.userRepository.update(id, userData);

    if (campaignIds && campaignIds.length > 0) {
      await this.campaignUserRepository.delete({ userId: id });
      await this.assignUserToCampaigns(id, campaignIds);
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

    return await this.findOne(id);
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

    return await this.findOne(userId);
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

  async assignUserToCampaigns(userId: number, campaignIds: number[]) {
    const campaignUsers = campaignIds.map((campaignId) =>
      this.campaignUserRepository.create({
        userId,
        campaignId,
      }),
    );
    return await this.campaignUserRepository.save(campaignUsers);
  }

  async removeUserFromCampaign(userId: number, campaignId: number) {
    return await this.campaignUserRepository.delete({
      userId,
      campaignId,
    });
  }
}
