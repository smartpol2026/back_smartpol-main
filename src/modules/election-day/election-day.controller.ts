import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Permission } from '../../permissions/permission.decorator';
import { ElectionDayService } from './election-day.service';
import { AssignWitnessTableDto } from './dto/assign-witness-table.dto';
import { CreateTableReportDto } from './dto/create-table-report.dto';
import { CreateTableNoveltyDto } from './dto/create-table-novelty.dto';

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
  @ApiOperation({ summary: 'Create a report for the witness assigned table' })
  createMyTableReport(@Body() dto: CreateTableReportDto, @Request() req: any) {
    return this.electionDayService.createMyTableReport(req.user, dto);
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
