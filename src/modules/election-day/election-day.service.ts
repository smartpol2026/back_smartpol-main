import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WitnessTableAssignment } from '../../database/entities/witness-table-assignment.entity';
import { TableReport } from '../../database/entities/table-report.entity';
import { TableNovelty } from '../../database/entities/table-novelty.entity';
import { CampaignUser } from '../../database/entities/campaign-user.entity';
import { User } from '../../database/entities/user.entity';
import { VotingBooth } from '../../database/entities/voting-booth.entity';
import { Campaign } from '../../database/entities/campaigns.entity';
import { AssignWitnessTableDto } from './dto/assign-witness-table.dto';
import { CreateTableReportDto } from './dto/create-table-report.dto';
import { CreateTableNoveltyDto } from './dto/create-table-novelty.dto';

type AuthUser = {
  id: number;
  roleId?: number;
  organizationId?: number | null;
};

@Injectable()
export class ElectionDayService {
  constructor(
    @InjectRepository(WitnessTableAssignment)
    private readonly assignmentRepo: Repository<WitnessTableAssignment>,
    @InjectRepository(TableReport)
    private readonly reportRepo: Repository<TableReport>,
    @InjectRepository(TableNovelty)
    private readonly noveltyRepo: Repository<TableNovelty>,
    @InjectRepository(CampaignUser)
    private readonly campaignUserRepo: Repository<CampaignUser>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(VotingBooth)
    private readonly boothRepo: Repository<VotingBooth>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
  ) {}

  async getUserCampaignIds(userId: number): Promise<number[]> {
    const rows = await this.campaignUserRepo.find({
      where: { userId },
      select: ['campaignId'],
    });
    return rows.map((row) => row.campaignId);
  }

  private async assertUserBelongsToCampaign(
    userId: number,
    campaignId: number,
  ): Promise<void> {
    const membership = await this.campaignUserRepo.findOne({
      where: { userId, campaignId },
    });
    if (!membership) {
      throw new ForbiddenException('El usuario no está asignado a esa campaña');
    }
  }

  private async resolveScopedCampaignId(
    authUser: AuthUser,
    requestedCampaignId?: number,
  ): Promise<number> {
    const campaignIds = await this.getUserCampaignIds(authUser.id);

    if (!campaignIds.length) {
      throw new ForbiddenException('El usuario no tiene una campaña asignada');
    }

    if (requestedCampaignId) {
      if (!campaignIds.includes(requestedCampaignId) && authUser.roleId !== 1) {
        throw new ForbiddenException(
          'No puedes consultar datos de una campaña no asignada',
        );
      }
      return requestedCampaignId;
    }

    if (campaignIds.length > 1 && authUser.roleId !== 1) {
      throw new BadRequestException(
        'Debes indicar campaignId porque el usuario tiene varias campañas',
      );
    }

    return campaignIds[0];
  }

  async assignWitnessTable(dto: AssignWitnessTableDto, authUser: AuthUser) {
    const creatorRoleId = Number(authUser.roleId);
    if (![1, 2].includes(creatorRoleId)) {
      throw new ForbiddenException(
        'No tiene permisos para realizar esta operación',
      );
    }

    const witness = await this.userRepo.findOne({
      where: { id: dto.userId },
    });
    if (!witness) {
      throw new NotFoundException('Usuario testigo no encontrado');
    }
    if (witness.roleId !== 8) {
      throw new BadRequestException(
        'Solo se puede asignar mesa a un Testigo electoral (roleId 8)',
      );
    }

    await this.assertUserBelongsToCampaign(dto.userId, dto.campaignId);

    const campaign = await this.campaignRepo.findOne({
      where: { id: dto.campaignId },
    });
    if (!campaign) {
      throw new NotFoundException('Campaña no encontrada');
    }

    // Admin de campaña solo puede operar sobre su organización
    if (
      authUser.roleId === 2 &&
      authUser.organizationId &&
      campaign.organizationId !== authUser.organizationId
    ) {
      throw new ForbiddenException(
        'No puedes asignar mesas de otra organización',
      );
    }

    const booth = await this.boothRepo.findOne({
      where: { id: dto.votingBoothId },
    });
    if (!booth) {
      throw new NotFoundException('Puesto de votación no encontrado');
    }
    if (dto.tableNumber < 1 || dto.tableNumber > booth.mesas) {
      throw new BadRequestException(
        `El número de mesa debe estar entre 1 y ${booth.mesas}`,
      );
    }

    const existing = await this.assignmentRepo.findOne({
      where: { userId: dto.userId, campaignId: dto.campaignId },
    });

    if (existing) {
      existing.votingBoothId = dto.votingBoothId;
      existing.tableNumber = dto.tableNumber;
      return this.assignmentRepo.save(existing);
    }

    const assignment = this.assignmentRepo.create(dto);
    return this.assignmentRepo.save(assignment);
  }

  async getMyTable(authUser: AuthUser, campaignId?: number) {
    const scopedCampaignId = await this.resolveScopedCampaignId(
      authUser,
      campaignId,
    );

    const assignment = await this.assignmentRepo.findOne({
      where: { userId: authUser.id, campaignId: scopedCampaignId },
      relations: ['votingBooth', 'votingBooth.municipality', 'campaign'],
    });

    if (!assignment) {
      throw new NotFoundException(
        'No tienes una mesa asignada en esta campaña',
      );
    }

    const [latestReport, reports, novelties] = await Promise.all([
      this.reportRepo.findOne({
        where: {
          campaignId: scopedCampaignId,
          votingBoothId: assignment.votingBoothId,
          tableNumber: assignment.tableNumber,
        },
        order: { createdAt: 'DESC' },
      }),
      this.reportRepo.find({
        where: {
          campaignId: scopedCampaignId,
          votingBoothId: assignment.votingBoothId,
          tableNumber: assignment.tableNumber,
        },
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.noveltyRepo.find({
        where: {
          campaignId: scopedCampaignId,
          votingBoothId: assignment.votingBoothId,
          tableNumber: assignment.tableNumber,
        },
        order: { createdAt: 'DESC' },
        take: 20,
      }),
    ]);

    return {
      campaignId: scopedCampaignId,
      campaignName: assignment.campaign?.name ?? null,
      votingBoothId: assignment.votingBoothId,
      votingBoothName: assignment.votingBooth?.name ?? null,
      tableNumber: assignment.tableNumber,
      municipalityName:
        (assignment.votingBooth as any)?.municipality?.name ?? null,
      currentStatus: latestReport?.status ?? 'sin_reporte',
      latestReport,
      reports,
      novelties,
    };
  }

  async createMyTableReport(authUser: AuthUser, dto: CreateTableReportDto) {
    const myTable = await this.getMyTable(authUser);

    const report = this.reportRepo.create({
      campaignId: myTable.campaignId,
      votingBoothId: myTable.votingBoothId,
      tableNumber: myTable.tableNumber,
      status: dto.status,
      estimatedParticipation: dto.estimatedParticipation ?? null,
      observations: dto.observations ?? null,
      evidenceUrl: dto.evidenceUrl ?? null,
      createdByUserId: authUser.id,
    });

    return this.reportRepo.save(report);
  }

  async createMyTableNovelty(authUser: AuthUser, dto: CreateTableNoveltyDto) {
    const myTable = await this.getMyTable(authUser);

    const novelty = this.noveltyRepo.create({
      campaignId: myTable.campaignId,
      votingBoothId: myTable.votingBoothId,
      tableNumber: myTable.tableNumber,
      severity: dto.severity,
      title: dto.title,
      description: dto.description ?? null,
      createdByUserId: authUser.id,
    });

    return this.noveltyRepo.save(novelty);
  }

  async getControlBoard(authUser: AuthUser, campaignId?: number) {
    const scopedCampaignId = await this.resolveScopedCampaignId(
      authUser,
      campaignId,
    );

    const assignments = await this.assignmentRepo.find({
      where: { campaignId: scopedCampaignId },
      relations: ['votingBooth', 'votingBooth.municipality', 'user'],
    });

    const reports = await this.reportRepo.find({
      where: { campaignId: scopedCampaignId },
      order: { createdAt: 'DESC' },
    });

    const novelties = await this.noveltyRepo.find({
      where: { campaignId: scopedCampaignId },
      order: { createdAt: 'DESC' },
      take: 50,
      relations: ['createdByUser'],
    });

    const latestByTable = new Map<string, TableReport>();
    for (const report of reports) {
      const key = `${report.votingBoothId}:${report.tableNumber}`;
      if (!latestByTable.has(key)) {
        latestByTable.set(key, report);
      }
    }

    const boothIds = [
      ...new Set(assignments.map((assignment) => assignment.votingBoothId)),
    ];

    let mesasConApertura = 0;
    let mesasEnOperacion = 0;
    let mesasConCierre = 0;
    let reportesRecibidos = reports.length;

    const tables = assignments.map((assignment) => {
      const key = `${assignment.votingBoothId}:${assignment.tableNumber}`;
      const latest = latestByTable.get(key);
      const status = latest?.status ?? 'sin_reporte';

      if (status === 'apertura') mesasConApertura += 1;
      if (status === 'en_operacion' || status === 'operativo') {
        mesasEnOperacion += 1;
      }
      if (status === 'cierre') mesasConCierre += 1;

      return {
        municipalityName:
          (assignment.votingBooth as any)?.municipality?.name ?? null,
        votingBoothId: assignment.votingBoothId,
        votingBoothName: assignment.votingBooth?.name ?? null,
        tableNumber: assignment.tableNumber,
        status,
        lastReportAt: latest?.createdAt ?? null,
        witnessEmail: assignment.user?.email ?? null,
        noveltiesCount: novelties.filter(
          (novelty) =>
            novelty.votingBoothId === assignment.votingBoothId &&
            novelty.tableNumber === assignment.tableNumber,
        ).length,
      };
    });

    const noveltyStats = {
      critica: novelties.filter((item) => item.severity === 'critica').length,
      alta: novelties.filter((item) => item.severity === 'alta').length,
      media: novelties.filter((item) => item.severity === 'media').length,
      baja: novelties.filter((item) => item.severity === 'baja').length,
    };

    return {
      campaignId: scopedCampaignId,
      kpis: {
        puestos: boothIds.length,
        mesas: assignments.length,
        mesasConApertura,
        mesasEnOperacion,
        mesasConCierre,
        reportesRecibidos,
      },
      noveltyStats,
      tables,
      recentNovelties: novelties.slice(0, 20).map((novelty) => ({
        id: novelty.id,
        severity: novelty.severity,
        title: novelty.title,
        description: novelty.description,
        votingBoothId: novelty.votingBoothId,
        tableNumber: novelty.tableNumber,
        createdAt: novelty.createdAt,
        createdByEmail: novelty.createdByUser?.email ?? null,
      })),
    };
  }

  async listCampaignNovelties(authUser: AuthUser, campaignId?: number) {
    const scopedCampaignId = await this.resolveScopedCampaignId(
      authUser,
      campaignId,
    );

    return this.noveltyRepo.find({
      where: { campaignId: scopedCampaignId },
      order: { createdAt: 'DESC' },
      relations: ['createdByUser', 'votingBooth'],
    });
  }

  async ensureCampaignAccessOrThrow(
    userId: number,
    campaignId: number,
  ): Promise<void> {
    const ids = await this.getUserCampaignIds(userId);
    if (!ids.includes(campaignId)) {
      throw new ForbiddenException(
        'No tienes acceso a la información de esa campaña',
      );
    }
  }
}
