import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permission } from '../../permissions/permission.decorator';
import { PoliticalStatusService } from './political-status.service';
import { CreatePoliticalStatusDto } from './dto/create-political-status.dto';
import { UpdatePoliticalStatusDto } from './dto/update-political-status.dto';
import { PoliticalStatus } from '../../database/entities/political-status.entity';

@ApiTags('Political Statuses')
@Controller('political-statuses')
export class PoliticalStatusController {
  constructor(private readonly politicalStatusService: PoliticalStatusService) {}

  @Post()
  @Permission('departments:manage')
  @ApiOperation({
    summary: 'Create a new political status',
  })
  @ApiBody({
    type: CreatePoliticalStatusDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Political status created successfully',
    type: PoliticalStatus,
  })
  async create(
    @Body() createPoliticalStatusDto: CreatePoliticalStatusDto,
  ): Promise<PoliticalStatus> {
    return this.politicalStatusService.create(createPoliticalStatusDto);
  }

  @Get()
  @Permission('departments:read')
  @ApiOperation({
    summary: 'Get all political statuses',
  })
  @ApiResponse({
    status: 200,
    description: 'Political statuses retrieved successfully',
    type: [PoliticalStatus],
  })
  async findAll(): Promise<PoliticalStatus[]> {
    return this.politicalStatusService.findAll();
  }

  @Get(':id')
  @Permission('departments:read')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Political status ID',
  })
  @ApiOperation({
    summary: 'Get political status by ID',
  })
  async findOne(@Param('id') id: string): Promise<PoliticalStatus | null> {
    return this.politicalStatusService.findOne(+id);
  }

  @Patch(':id')
  @Permission('departments:manage')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Political status ID',
  })
  @ApiBody({
    type: UpdatePoliticalStatusDto,
  })
  @ApiOperation({
    summary: 'Update political status',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePoliticalStatusDto: UpdatePoliticalStatusDto,
  ): Promise<PoliticalStatus | null> {
    return this.politicalStatusService.update(+id, updatePoliticalStatusDto);
  }

  @Delete(':id')
  @Permission('departments:manage')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Political status ID',
  })
  @ApiOperation({
    summary: 'Delete political status',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.politicalStatusService.remove(+id);
  }
}
