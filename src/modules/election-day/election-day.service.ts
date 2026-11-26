import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
import { EvidenceStorageService } from './evidence-storage.service';
import {
  ELECTION_DAY_EVENTS,
  ElectionDayRealtimeService,
} from './election-day-realtime.service';
import { MapPointsQueryDto } from './dto/map-points-query.dto';

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
    private readonly evidenceStorage: EvidenceStorageService,
    private readonly realtime: ElectionDayRealtimeService,
  ) {}

  private readonly severityOrder: Record<string, number> = {
    critica: 0,
    alta: 1,
    media: 2,
    baja: 3,
  };

  private sortNoveltiesBySeverityAndDate<
    T extends { severity: string; createdAt: Date },
  >(items: T[]): T[] {
    return [...items].sort((a, b) => {
      const severityA = this.severityOrder[a.severity] ?? 99;
      const severityB = this.severityOrder[b.severity] ?? 99;
      if (severityA !== severityB) {
        return severityA - severityB;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  private mapReportForResponse(report: TableReport) {
    const hasStoredEvidence = !!report.evidencePath;
    return {
      id: report.id,
      campaignId: report.campaignId,
      votingBoothId: report.votingBoothId,
      tableNumber: report.tableNumber,
      status: report.status,
      estimatedParticipation: report.estimatedParticipation,
      observations: report.observations,
      createdByUserId: report.createdByUserId,
      createdAt: report.createdAt,
      hasEvidence: hasStoredEvidence || !!report.evidenceUrl,
      evidenceOriginalName: report.evidenceOriginalName,
      evidenceMimeType: report.evidenceMimeType,
      evidenceSizeBytes: report.evidenceSizeBytes
        ? Number(report.evidenceSizeBytes)
        : null,
      evidenceUrl: hasStoredEvidence
        ? `/election-day/my-table/reports/${report.id}/evidence`
        : report.evidenceUrl,
    };
  }

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
      tableId: assignment.id,
      campaignId: scopedCampaignId,
      campaignName: assignment.campaign?.name ?? null,
      votingBoothId: assignment.votingBoothId,
      votingBoothName: assignment.votingBooth?.name ?? null,
      tableNumber: assignment.tableNumber,
      municipalityName:
        (assignment.votingBooth as any)?.municipality?.name ?? null,
      currentStatus: latestReport?.status ?? 'sin_reporte',
      latestReport: latestReport
        ? this.mapReportForResponse(latestReport)
        : null,
      reports: reports.map((report) => this.mapReportForResponse(report)),
      novelties: this.sortNoveltiesBySeverityAndDate(novelties),
    };
  }

  async createMyTableReport(
    authUser: AuthUser,
    dto: CreateTableReportDto,
    file?: Express.Multer.File,
  ) {
    const myTable = await this.getMyTable(authUser);

    let evidencePath: string | null = null;
    let evidenceOriginalName: string | null = null;
    let evidenceMimeType: string | null = null;
    let evidenceSizeBytes: number | null = null;
    let evidenceUrl: string | null = null;

    if (file) {
      const saved = await this.evidenceStorage.saveEvidenceFile(file);
      evidencePath = saved.relativePath;
      evidenceOriginalName = saved.originalName;
      evidenceMimeType = saved.mimeType;
      evidenceSizeBytes = saved.sizeBytes;
    }

    const report = this.reportRepo.create({
      campaignId: myTable.campaignId,
      votingBoothId: myTable.votingBoothId,
      tableNumber: myTable.tableNumber,
      status: dto.status,
      estimatedParticipation: dto.estimatedParticipation ?? null,
      observations: dto.observations ?? null,
      evidenceUrl,
      evidencePath,
      evidenceOriginalName,
      evidenceMimeType,
      evidenceSizeBytes,
      createdByUserId: authUser.id,
    });

    const savedReport = await this.reportRepo.save(report);

    if (savedReport.evidencePath) {
      savedReport.evidenceUrl = `/election-day/my-table/reports/${savedReport.id}/evidence`;
      await this.reportRepo.save(savedReport);
    }

    const eventData = {
      tableId: myTable.tableId,
      reportId: savedReport.id,
      votingBoothId: savedReport.votingBoothId,
      tableNumber: savedReport.tableNumber,
      status: savedReport.status,
      estimatedParticipation:
        savedReport.estimatedParticipation == null
          ? null
          : Number(savedReport.estimatedParticipation),
      hasEvidence: !!savedReport.evidencePath || !!savedReport.evidenceUrl,
      createdAt: savedReport.createdAt,
    };

    this.realtime.emitToCampaign(
      savedReport.campaignId,
      ELECTION_DAY_EVENTS.REPORT_CREATED,
      eventData,
    );
    this.realtime.emitToCampaign(
      savedReport.campaignId,
      ELECTION_DAY_EVENTS.TABLE_UPDATED,
      eventData,
    );

    return this.mapReportForResponse(savedReport);
  }

  async getReportEvidence(authUser: AuthUser, reportId: number) {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report || !report.evidencePath) {
      throw new NotFoundException('Evidencia no encontrada');
    }

    await this.ensureCampaignAccessOrThrow(authUser.id, report.campaignId);

    // Testigo: solo evidencias de su mesa asignada
    if (authUser.roleId === 8) {
      const assignment = await this.assignmentRepo.findOne({
        where: {
          userId: authUser.id,
          campaignId: report.campaignId,
        },
      });
      if (
        !assignment ||
        assignment.votingBoothId !== report.votingBoothId ||
        assignment.tableNumber !== report.tableNumber
      ) {
        throw new ForbiddenException(
          'No tiene permisos para realizar esta operación',
        );
      }
    }

    const stream = await this.evidenceStorage.openEvidenceStream(
      report.evidencePath,
    );

    return {
      stream,
      mimeType: report.evidenceMimeType || 'application/octet-stream',
      originalName: report.evidenceOriginalName || `evidence-${report.id}`,
      sizeBytes: report.evidenceSizeBytes
        ? Number(report.evidenceSizeBytes)
        : undefined,
    };
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

    const savedNovelty = await this.noveltyRepo.save(novelty);

    this.realtime.emitToCampaign(
      savedNovelty.campaignId,
      ELECTION_DAY_EVENTS.NOVELTY_CREATED,
      {
        id: savedNovelty.id,
        severity: savedNovelty.severity,
        title: savedNovelty.title,
        description: savedNovelty.description,
        votingBoothId: savedNovelty.votingBoothId,
        tableNumber: savedNovelty.tableNumber,
        createdAt: savedNovelty.createdAt,
      },
    );

    return savedNovelty;
  }

  async getMapPoints(authUser: AuthUser, filters: MapPointsQueryDto) {
    if (!authUser.organizationId) {
      throw new ForbiddenException(
        'El usuario debe pertenecer a una organización',
      );
    }

    let campaignIds: number[];

    if (authUser.roleId === 2) {
      // Admin de campaña: todas las campañas de su organización.
      const campaigns = await this.campaignRepo.find({
        where: { organizationId: authUser.organizationId },
        select: ['id'],
      });
      campaignIds = campaigns.map((campaign) => campaign.id);
    } else {
      // Director (y cualquier otro rol autorizado): solo campañas asignadas.
      const memberships = await this.campaignUserRepo
        .createQueryBuilder('membership')
        .innerJoin('membership.campaign', 'campaign')
        .select('membership.campaignId', 'campaignId')
        .where('membership.userId = :userId', { userId: authUser.id })
        .andWhere('campaign.organizationId = :organizationId', {
          organizationId: authUser.organizationId,
        })
        .getRawMany<{ campaignId: number }>();
      campaignIds = memberships.map((row) => Number(row.campaignId));
    }

    if (!campaignIds.length) {
      return { points: [], summary: [] };
    }

    const assignments = await this.assignmentRepo.find({
      where: { campaignId: In(campaignIds) },
      relations: [
        'votingBooth',
        'votingBooth.municipality',
        'votingBooth.municipality.department',
      ],
    });

    const boothById = new Map<number, VotingBooth>();
    for (const assignment of assignments) {
      const booth = assignment.votingBooth;
      const municipality = booth?.municipality;
      const department = municipality?.department;
      const departmentCode = String(department?.code ?? '').padStart(2, '0');
      const municipalityCode = String(municipality?.code ?? '').padStart(
        5,
        '0',
      );

      // El mapa solo puede representar puestos georreferenciados.
      if (
        booth?.latitude == null ||
        booth?.longitude == null ||
        (filters.departmentCode && departmentCode !== filters.departmentCode) ||
        (filters.municipalityCode &&
          municipalityCode !== filters.municipalityCode)
      ) {
        continue;
      }

      boothById.set(booth.id, booth);
    }

    const boothIds = [...boothById.keys()];
    if (!boothIds.length) {
      return { points: [], summary: [] };
    }

    const [reports, noveltyBooths] = await Promise.all([
      this.reportRepo.find({
        where: {
          campaignId: In(campaignIds),
          votingBoothId: In(boothIds),
        },
        order: { createdAt: 'DESC' },
      }),
      this.noveltyRepo
        .createQueryBuilder('novelty')
        .select('DISTINCT novelty.votingBoothId', 'votingBoothId')
        .where('novelty.campaignId IN (:...campaignIds)', { campaignIds })
        .andWhere('novelty.votingBoothId IN (:...boothIds)', { boothIds })
        .getRawMany<{ votingBoothId: number }>(),
    ]);

    const latestReportByBooth = new Map<number, TableReport>();
    for (const report of reports) {
      if (!latestReportByBooth.has(report.votingBoothId)) {
        latestReportByBooth.set(report.votingBoothId, report);
      }
    }

    const boothsWithNovelties = new Set(
      noveltyBooths.map((row) => Number(row.votingBoothId)),
    );
    const validStatuses = new Set([
      'apertura',
      'en_operacion',
      'operativo',
      'cierre',
    ]);

    const points = boothIds.map((boothId) => {
      const booth = boothById.get(boothId)!;
      const municipality = booth.municipality;
      const department = municipality.department;
      const latestStatus = latestReportByBooth.get(boothId)?.status;
      const status = validStatuses.has(latestStatus ?? '')
        ? latestStatus
        : latestStatus === 'sin_novedad'
          ? 'operativo'
          : 'sin_reporte';

      return {
        id: booth.id,
        name: booth.name,
        type: 'puesto' as const,
        lat: booth.latitude,
        lng: booth.longitude,
        departmentCode: String(department.code).padStart(2, '0'),
        municipalityCode: String(municipality.code).padStart(5, '0'),
        status,
        hasNovelties: boothsWithNovelties.has(booth.id),
      };
    });

    const summaryLevel =
      filters.departmentCode || filters.municipalityCode
        ? ('municipality' as const)
        : ('department' as const);
    const summaryByCode = new Map<
      string,
      {
        code: string;
        level: 'department' | 'municipality';
        total: number;
        withNovelties: number;
      }
    >();

    for (const point of points) {
      const code =
        summaryLevel === 'department'
          ? point.departmentCode
          : point.municipalityCode;
      const current = summaryByCode.get(code) ?? {
        code,
        level: summaryLevel,
        total: 0,
        withNovelties: 0,
      };
      current.total += 1;
      if (point.hasNovelties) current.withNovelties += 1;
      summaryByCode.set(code, current);
    }

    return {
      points,
      summary: [...summaryByCode.values()].sort((a, b) =>
        a.code.localeCompare(b.code),
      ),
    };
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

    const novelties = this.sortNoveltiesBySeverityAndDate(
      await this.noveltyRepo.find({
        where: { campaignId: scopedCampaignId },
        order: { createdAt: 'DESC' },
        take: 50,
        relations: ['createdByUser'],
      }),
    );

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

    const novelties = await this.noveltyRepo.find({
      where: { campaignId: scopedCampaignId },
      order: { createdAt: 'DESC' },
      relations: ['createdByUser', 'votingBooth'],
    });

    return this.sortNoveltiesBySeverityAndDate(novelties);
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
