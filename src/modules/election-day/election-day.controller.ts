import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { Permission } from '../../permissions/permission.decorator';
import { ElectionDayService } from './election-day.service';
import { AssignWitnessTableDto } from './dto/assign-witness-table.dto';
import { CreateTableReportDto } from './dto/create-table-report.dto';
import { CreateTableNoveltyDto } from './dto/create-table-novelty.dto';

const ALLOWED_EVIDENCE_MIME =
  /^(image\/(jpeg|jpg|png|webp|gif)|video\/(mp4|webm|quicktime|ogg))$/i;
const MAX_EVIDENCE_BYTES = 50 * 1024 * 1024; // 50 MB

@ApiTags('Election Day')
@ApiBearerAuth('access-token')
@Controller('election-day')
export class ElectionDayController {
  constructor(private readonly electionDayService: ElectionDayService) {}

  @Post('witness-assignments')
  @Permission(['users:update', 'users:manage'])
  @ApiOperation({
    summary:
      'Assign or change the voting table of an electoral witness (Superadmin / Admin de campaña)',
  })
  assignWitnessTable(@Body() dto: AssignWitnessTableDto, @Request() req: any) {
    return this.electionDayService.assignWitnessTable(dto, req.user);
  }

  @Patch('witness-assignments')
  @Permission(['users:update', 'users:manage'])
  @ApiOperation({
    summary:
      'Change the voting table of an electoral witness (Superadmin / Admin de campaña)',
  })
  updateWitnessTable(@Body() dto: AssignWitnessTableDto, @Request() req: any) {
    return this.electionDayService.assignWitnessTable(dto, req.user);
  }

  @Get('my-table')
  @Permission('my-table:read')
  @ApiOperation({ summary: 'Get the authenticated witness assigned table' })
  @ApiQuery({ name: 'campaignId', required: false, type: Number })
  getMyTable(@Request() req: any, @Query('campaignId') campaignId?: string) {
    return this.electionDayService.getMyTable(
      req.user,
      campaignId ? parseInt(campaignId, 10) : undefined,
    );
  }

  @Post('my-table/reports')
  @Permission('my-table:report')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: [
            'apertura',
            'en_operacion',
            'cierre',
            'operativo',
            'sin_novedad',
          ],
        },
        estimatedParticipation: { type: 'number', example: 68.5 },
        observations: { type: 'string' },
        evidence: {
          type: 'string',
          format: 'binary',
          description: 'Foto o video de evidencia',
        },
      },
    },
  })
  @ApiOperation({
    summary:
      'Create a report for the witness assigned table (multipart, optional evidence file)',
  })
  @UseInterceptors(
    FileInterceptor('evidence', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_EVIDENCE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_EVIDENCE_MIME.test(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Solo se permiten imágenes (jpeg, png, webp, gif) o videos (mp4, webm, mov, ogg)',
            ) as any,
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  createMyTableReport(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateTableReportDto,
    @Request() req: any,
  ) {
    return this.electionDayService.createMyTableReport(req.user, dto, file);
  }

  @Get('my-table/reports/:reportId/evidence')
  @Permission(['my-table:read', 'control-board:read'])
  @ApiOperation({ summary: 'Download evidence file of a table report' })
  async getReportEvidence(
    @Param('reportId', ParseIntPipe) reportId: number,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const evidence = await this.electionDayService.getReportEvidence(
      req.user,
      reportId,
    );

    res.setHeader('Content-Type', evidence.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(evidence.originalName)}"`,
    );
    if (evidence.sizeBytes) {
      res.setHeader('Content-Length', evidence.sizeBytes);
    }

    evidence.stream.pipe(res);
  }

  @Post('my-table/novelties')
  @Permission('novelties:create')
  @ApiOperation({ summary: 'Create a novelty for the witness assigned table' })
  createMyTableNovelty(
    @Body() dto: CreateTableNoveltyDto,
    @Request() req: any,
  ) {
    return this.electionDayService.createMyTableNovelty(req.user, dto);
  }

  @Get('control-board')
  @Permission('control-board:read')
  @ApiOperation({
    summary: 'Get campaign control board metrics scoped to assigned campaign',
  })
  @ApiQuery({ name: 'campaignId', required: false, type: Number })
  getControlBoard(
    @Request() req: any,
    @Query('campaignId') campaignId?: string,
  ) {
    return this.electionDayService.getControlBoard(
      req.user,
      campaignId ? parseInt(campaignId, 10) : undefined,
    );
  }

  @Get('control-board/:campaignId')
  @Permission('control-board:read')
  @ApiOperation({
    summary: 'Get initial control board state for one campaign',
  })
  getControlBoardByCampaign(
    @Request() req: any,
    @Param('campaignId', ParseIntPipe) campaignId: number,
  ) {
    return this.electionDayService.getControlBoard(req.user, campaignId);
  }

  @Get('novelties')
  @Permission('novelties:read')
  @ApiOperation({ summary: 'List novelties for the assigned campaign' })
  @ApiQuery({ name: 'campaignId', required: false, type: Number })
  listNovelties(@Request() req: any, @Query('campaignId') campaignId?: string) {
    return this.electionDayService.listCampaignNovelties(
      req.user,
      campaignId ? parseInt(campaignId, 10) : undefined,
    );
  }
}
