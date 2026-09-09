import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CandidateService } from './candidate.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { Candidate } from '../../database/entities/candidate.entity';
import { Permission } from '../../permissions/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Candidates')
@Controller('candidates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Post()
  @Permission(['candidates:create', 'candidates:manage'])
  @ApiOperation({
    summary: 'Create a new candidate',
    description: 'Register a new political candidate in the system',
  })
  @ApiBody({
    type: CreateCandidateDto,
    description: 'Candidate data',
    examples: {
      example1: {
        value: {
          name: 'Juan Duarte',
          party: 'Partido Colombiano',
          number: 1,
          corporation_id: 1,
          campaignId: 1,
          userId: 73,
        },
        description: 'Example of creating a candidate',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Candidate created successfully',
    schema: {
      example: {
        id: 1,
        name: 'Juan Duarte',
        party: 'Partido Colombiano',
        number: 1,
        corporation_id: 1,
        campaignId: 1,
        userId: 73,
        campaign: {
          id: 1,
          name: 'Campaign A',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
        createdAt: '2024-01-27T10:30:00Z',
        updatedAt: '2024-01-27T10:30:00Z',
      },
    },
  })
  async create(
    @Body() createCandidateDto: CreateCandidateDto,
    @Request() req: any,
  ): Promise<Candidate> {
    // El usuario autenticado viene en req.user
    const authUserId = req.user?.id;
    return await this.candidateService.create(createCandidateDto, authUserId);
  }

  @Get('votes/by-candidate')
  @Permission('candidates:read')
  @ApiOperation({
    summary: 'Get voter count by candidate',
    description:
      "Returns the count of voters assigned to each candidate of the authenticated user's organization",
  })
  @ApiResponse({
    status: 200,
    description: 'Voter count by candidate retrieved successfully',
    schema: {
      example: [
        {
          candidateId: 1,
          candidateName: 'Juan Pérez',
          voterCount: 150,
        },
        {
          candidateId: 2,
          candidateName: 'María García',
          voterCount: 120,
        },
      ],
    },
  })
  async getVoterCountByCandidate(@Request() req: any) {
    return await this.candidateService.getVoterCountByCandidate(
      req.user?.organizationId,
    );
  }

  @Get('votes/by-party')
  @Permission('candidates:read')
  @ApiOperation({
    summary: 'Get voter count by party',
    description:
      "Returns the count of voters assigned to each party of the authenticated user's organization",
  })
  @ApiResponse({
    status: 200,
    description: 'Voter count by party retrieved successfully',
    schema: {
      example: [
        {
          party: 'Partido Liberal Colombiano',
          voterCount: 150,
        },
        {
          party: 'Partido Conservador',
          voterCount: 120,
        },
      ],
    },
  })
  async getVoterCountByParty(@Request() req: any) {
    return await this.candidateService.getVoterCountByParty(
      req.user?.organizationId,
    );
  }

  @Get()
  @Permission('candidates:read')
  @ApiOperation({
    summary: 'Get all candidates',
    description:
      'Returns the complete list of registered candidates with pagination and search support.',
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'Page number (starts at 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    type: 'string',
    required: false,
    description: 'Search by name, party or number (case-insensitive)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of candidates retrieved successfully',
  })
  async findAll(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    // ✅ PASAR organizationId del usuario autenticado al servicio
    return await this.candidateService.findAllWithPagination(
      pageNum,
      limitNum,
      search,
      req.user?.organizationId,
    );
  }

  @Get('by-campaign/:campaignId')
  @Permission('candidates:read')
  @ApiParam({
    name: 'campaignId',
    type: 'number',
    description: 'Campaign ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Get candidates by campaign ID',
    description: 'Returns all candidates associated with a specific campaign',
  })
  @ApiResponse({
    status: 200,
    description: 'Candidates found for the campaign',
  })
  async findByCampaignId(
    @Param('campaignId') campaignId: string,
  ): Promise<Candidate[]> {
    return await this.candidateService.findByCampaignIds([+campaignId]);
  }

  @Get(':id')
  @Permission('candidates:read')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Candidate ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Get candidate by ID',
    description: 'Returns a specific candidate',
  })
  @ApiResponse({
    status: 200,
    description: 'Candidate found',
  })
  async findOne(@Param('id') id: string): Promise<Candidate | null> {
    return await this.candidateService.findOne(+id);
  }

  @Get('by-user/:userId')
  @Permission('candidates:read')
  @ApiParam({
    name: 'userId',
    type: 'number',
    description: 'User ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Get candidate by user ID',
    description: 'Returns the candidate associated with a specific user',
  })
  async findByUserId(
    @Param('userId') userId: string,
  ): Promise<Candidate | null> {
    return await this.candidateService.findByUserId(+userId);
  }

  @Patch(':id')
  @Permission(['candidates:update', 'candidates:manage'])
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Candidate ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Update a candidate',
    description: 'Update candidate information including campaign assignment',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCandidateDto: UpdateCandidateDto,
  ): Promise<Candidate | null> {
    return await this.candidateService.update(+id, updateCandidateDto);
  }

  @Delete(':id')
  @Permission(['candidates:delete', 'candidates:manage'])
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Candidate ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Delete a candidate',
    description: 'Delete a candidate from the system',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.candidateService.remove(+id);
  }

  @Post(':candidateId/leaders/:leaderId')
  @Permission(['candidates:create', 'candidates:manage'])
  @ApiParam({
    name: 'candidateId',
    type: 'number',
    description: 'Candidate ID',
    example: 1,
  })
  @ApiParam({
    name: 'leaderId',
    type: 'number',
    description: 'Leader ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Assign a leader to a candidate',
    description: 'Assigns a political leader to a candidate',
  })
  async assignLeaderToCandidate(
    @Param('candidateId') candidateId: string,
    @Param('leaderId') leaderId: string,
  ): Promise<Candidate> {
    return await this.candidateService.assignLeaderToCandidate(
      +candidateId,
      +leaderId,
    );
  }

  @Delete(':candidateId/leaders/:leaderId')
  @Permission(['candidates:delete', 'candidates:manage'])
  @ApiParam({
    name: 'candidateId',
    type: 'number',
    description: 'Candidate ID',
  })
  @ApiParam({
    name: 'leaderId',
    type: 'number',
    description: 'Leader ID',
  })
  @ApiOperation({
    summary: 'Remove a leader from a candidate',
    description: 'Removes the assignment of a leader from a candidate',
  })
  async removeLeaderFromCandidate(
    @Param('candidateId') candidateId: string,
    @Param('leaderId') leaderId: string,
  ): Promise<Candidate> {
    return await this.candidateService.removeLeaderFromCandidate(
      +candidateId,
      +leaderId,
    );
  }

  @Get(':candidateId/leaders')
  @Permission('candidates:read')
  @ApiParam({
    name: 'candidateId',
    type: 'number',
    description: 'Candidate ID',
  })
  @ApiOperation({
    summary: 'Get all leaders of a candidate',
    description: 'Returns all leaders assigned to a specific candidate',
  })
  async getLeadersByCandidate(@Param('candidateId') candidateId: string) {
    return await this.candidateService.getLeadersByCandidate(+candidateId);
  }

  @Get('filter/leader/:leaderId/corporation/:corporationId')
  @Permission('candidates:read')
  @ApiParam({
    name: 'leaderId',
    type: 'number',
    description: 'Leader ID',
  })
  @ApiParam({
    name: 'corporationId',
    type: 'number',
    description: 'Corporation ID',
  })
  @ApiOperation({
    summary: 'Get candidates by leader and corporation',
    description:
      'Returns all candidates associated with a specific leader and corporation',
  })
  async findByLeaderAndCorporation(
    @Param('leaderId') leaderId: number,
    @Param('corporationId') corporationId: number,
  ): Promise<Candidate[]> {
    return await this.candidateService.findByLeaderAndCorporation(
      leaderId,
      corporationId,
    );
  }
}
