import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { VoterService } from './voter.service';
import { Permission } from '../../permissions/permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateVoterDto } from './dto/create-voter.dto';
import { UpdateVoterDto } from './dto/update-voter.dto';
import { AssignCandidateDto } from './dto/assign-candidate.dto';
import { VoterReportFilterDto } from './dto/voter-report.dto';
import { VoterSearchByIdentificationDto } from './dto/voter-search-identification.dto';
import {
  PaginationQueryDto,
  PaginatedResponseDto,
} from './dto/pagination-query.dto';
import { SearchVotersDto } from './dto/search-voters.dto';
import { SearchTrackingFilterDto } from './dto/search-tracking-filter.dto';
import { AnalysisReportFilterDto } from './dto/analysis-report.dto';
import { Voter } from '../../database/entities/voter.entity';
import { CandidateVoter } from '../../database/entities/candidate-voter.entity';
import { RegisterVoteDto } from './dto/register-vote.dto';
import { VotingStatsDto } from './dto/voting-stats.dto';

@ApiTags('Voters')
@Controller('voters')
export class VoterController {
  constructor(private readonly voterService: VoterService) {}

  @Post()
  @Permission('voters:create')
  @ApiOperation({
    summary: 'Create a new voter',
    description: 'Register a new voter in the system',
  })
  @ApiBody({
    type: CreateVoterDto,
    description: 'Voter data',
    examples: {
      example1: {
        value: {
          firstName: 'Juan',
          lastName: 'Pérez García',
          identification: '1234567890',
          gender: 'M',
          bloodType: 'O+',
          birthDate: '1980-01-15',
          phone: '+57 312 123 4567',
          address: 'Cra 5 #12-34 Apt 201',
          departmentId: 1,
          municipalityId: 1,
          neighborhood: 'Centro',
          email: 'voter@example.com',
          occupation: 'Ingeniero',
          votingBoothId: 1,
          votingTableId: 1,
          politicalStatus: 'Active',
        },
        description: 'Example of creating a voter',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Voter created successfully',
    schema: {
      example: {
        id: 1,
        firstName: 'Juan',
        lastName: 'Pérez García',
        identification: '1234567890',
        gender: 'M',
        bloodType: 'O+',
        birthDate: '1980-01-15',
        phone: '+57 312 123 4567',
        address: 'Cra 5 #12-34 Apt 201',
        departmentId: 1,
        municipalityId: 1,
        neighborhood: 'Centro',
        email: 'voter@example.com',
        occupation: 'Ingeniero',
        votingBoothId: 1,
        votingTableId: 1,
        politicalStatus: 'Active',
        createdAt: '2024-01-27T10:30:00Z',
        updatedAt: '2024-01-27T10:30:00Z',
      },
    },
  })
  async create(
    @Body() createVoterDto: CreateVoterDto,
    @CurrentUser() user: any,
  ): Promise<Voter> {
    return await this.voterService.create(
      createVoterDto,
      user.id,
      user.organizationId,
    );
  }

  @Get()
  @Permission('voters:read')
  @ApiOperation({
    summary: 'Get all voters with pagination',
    description:
      'Returns a paginated list of registered voters. Campaign admins and digitadores will only see voters from their organization.',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    example: 1,
    description: 'Page number (starting from 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 20,
    description: 'Number of items per page (max 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of voters retrieved successfully',
  })
  async findAll(
    @Query() paginationQueryDto: PaginationQueryDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedResponseDto<Voter>> {
    return await this.voterService.findAllPaginated(paginationQueryDto, user);
  }

  @Get('search/all-with-assignments')
  @Permission('voters:read')
  @ApiOperation({
    summary:
      'Get all voters with assigned candidates/leaders (optimized for search)',
    description:
      'Returns all voters with their assigned candidates and leaders in a single request. Filtered by role if needed. Campaign admins and digitadores will only see voters from their organization.',
  })
  @ApiQuery({
    name: 'roleId',
    type: Number,
    required: false,
    description: 'User role ID (3=candidate, 4=leader)',
  })
  @ApiQuery({
    name: 'candidateId',
    type: Number,
    required: false,
    description: 'Candidate ID (required if roleId=3)',
  })
  @ApiQuery({
    name: 'leaderId',
    type: Number,
    required: false,
    description: 'Leader ID (required if roleId=4)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of voters with assignments retrieved successfully',
  })
  async findAllWithAssignments(
    @Query('roleId') roleId?: string,
    @Query('candidateId') candidateId?: string,
    @Query('leaderId') leaderId?: string,
    @CurrentUser() user?: any,
  ): Promise<Voter[]> {
    return await this.voterService.findAllWithAssignmentsByRole(
      roleId ? parseInt(roleId) : undefined,
      candidateId ? parseInt(candidateId) : undefined,
      leaderId ? parseInt(leaderId) : undefined,
      user,
    );
  }

  @Get('search/by-name-or-identification')
  @Permission('voters:read')
  @ApiOperation({
    summary: 'Search voters by name or identification with pagination',
    description:
      'Search for voters by first name, last name, or identification number. Returns paginated results with assigned candidates and leaders.',
  })
  @ApiQuery({
    name: 'q',
    type: String,
    required: true,
    description: 'Search query (firstName, lastName, or identification)',
    example: 'Juan',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    example: 1,
    description: 'Page number (starting from 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 20,
    description: 'Number of items per page (max 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  async searchByNameOrIdentification(
    @Query() searchDto: SearchVotersDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedResponseDto<Voter>> {
    return await this.voterService.searchVotersByNameOrIdentification(
      searchDto.q,
      searchDto,
      user,
    );
  }

  @Get('search/by-identification/:identification')
  @Permission('voters:read')
  @ApiOperation({
    summary: 'Search voter by identification',
    description:
      'Search for a voter by identification in both voters and voters_history tables. Returns voter data if found in either table, along with assignment information if available.',
  })
  @ApiParam({
    name: 'identification',
    type: 'string',
    description: 'Voter identification number',
    example: '1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Voter search result',
    schema: {
      example: {
        status: 'assigned',
        voter: {
          id: 1,
          firstName: 'Juan',
          lastName: 'Pérez',
          identification: '1234567890',
          gender: 'M',
          bloodType: 'O+',
          birthDate: '1980-01-15',
          phone: '3121234567',
          address: 'Cra 5 #12-34',
          email: 'juan@example.com',
          occupation: 'Ingeniero',
        },
        assignedLeader: {
          id: 1,
          firstName: 'Carlos',
          lastName: 'Lopez',
          email: 'carlos@example.com',
        },
        assignedCandidates: [
          {
            id: 1,
            firstName: 'Maria',
            lastName: 'Garcia',
            campaignName: 'Campaign 2024',
          },
        ],
      },
    },
  })
  async searchByIdentification(
    @Param('identification') identification: string,
    @CurrentUser() user: any,
  ): Promise<VoterSearchByIdentificationDto> {
    return await this.voterService.searchByIdentification(identification, user);
  }

  @Get('by-identification-diad/:identification')
  @Permission('voting:access')
  @ApiParam({
    name: 'identification',
    type: 'string',
    description: 'Voter identification',
    example: '1234567890',
  })
  @ApiOperation({
    summary: 'Search voter by identification for Día D',
    description:
      'Search for a voter by their identification (cédula) number for Día D voting. Only searches in active voters, not in history.',
  })
  @ApiResponse({
    status: 200,
    description: 'Voter found',
  })
  async searchByIdentificationForDiaD(
    @Param('identification') identification: string,
    @CurrentUser() user: any,
  ): Promise<VoterSearchByIdentificationDto> {
    return await this.voterService.searchByIdentificationForDiaD(
      identification,
      user,
    );
  }

  @Get('by-candidate/:candidateId')
  @Permission('voters:read')
  @ApiParam({
    name: 'candidateId',
    type: 'number',
    description: 'Candidate ID',
    example: 1,
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    example: 1,
    description: 'Page number (starting from 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 20,
    description: 'Number of items per page (max 100)',
  })
  @ApiOperation({
    summary: 'Get voters by candidate with pagination',
    description:
      'Returns a paginated list of voters assigned to a specific candidate',
  })
  @ApiResponse({
    status: 200,
    description: 'List of voters for the candidate retrieved successfully',
  })
  async findByCandidate(
    @Param('candidateId') candidateId: string,
    @Query() paginationQueryDto: PaginationQueryDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedResponseDto<Voter>> {
    return await this.voterService.findByCandidatePaginated(
      +candidateId,
      paginationQueryDto,
      user,
    );
  }

  @Get('by-leader/:leaderId')
  @Permission('voters:read')
  @ApiParam({
    name: 'leaderId',
    type: 'number',
    description: 'Leader ID',
    example: 1,
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    example: 1,
    description: 'Page number (starting from 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 20,
    description: 'Number of items per page (max 100)',
  })
  @ApiOperation({
    summary: 'Get voters by leader with pagination',
    description:
      'Returns a paginated list of voters assigned to a specific leader',
  })
  @ApiResponse({
    status: 200,
    description: 'List of voters for the leader retrieved successfully',
  })
  async findByLeader(
    @Param('leaderId') leaderId: string,
    @Query() paginationQueryDto: PaginationQueryDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedResponseDto<Voter>> {
    return await this.voterService.findByLeaderPaginated(
      +leaderId,
      paginationQueryDto,
      user,
    );
  }

  @Get('by-identification/:identification')
  @Permission('voters:read')
  @ApiParam({
    name: 'identification',
    description: 'Voter identification number',
  })
  @ApiOperation({
    summary: 'Find voter by identification',
    description:
      'Search for a voter using their identification number. Returns null if not found.',
  })
  @ApiResponse({
    status: 200,
    description: 'Voter found or null if not exists',
  })
  async findByIdentification(
    @Param('identification') identification: string,
  ): Promise<any> {
    const voter = await this.voterService.findByIdentification(identification);
    return voter || null;
  }

  @Get('stats')
  @Permission('voters:read')
  @ApiOperation({
    summary: 'Get voting statistics',
    description:
      'Get real-time statistics of expected, registered, and pending votes for Día D report',
  })
  @ApiResponse({
    status: 200,
    description: 'Voting statistics retrieved successfully',
    schema: {
      example: {
        expected: 1000,
        registered: 350,
        pending: 650,
      },
    },
  })
  async getVotingStats(@CurrentUser() user: any): Promise<VotingStatsDto> {
    return await this.voterService.getVotingStats(user);
  }

  @Get('list/registered')
  @Permission('voters:read')
  @ApiOperation({
    summary: 'Get registered voters list',
    description:
      'Get a list of all voters who have already voted (hasVoted = true)',
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Voters per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Registered voters retrieved successfully',
  })
  async getRegisteredVoters(
    @Query() paginationQueryDto: PaginationQueryDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedResponseDto<Voter>> {
    return await this.voterService.getVotersByStatus(
      true,
      paginationQueryDto,
      user,
    );
  }

  @Get('list/pending')
  @Permission('voters:read')
  @ApiOperation({
    summary: 'Get pending voters list',
    description:
      'Get a list of all voters who have not yet voted (hasVoted = false)',
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Voters per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending voters retrieved successfully',
  })
  async getPendingVoters(
    @Query() paginationQueryDto: PaginationQueryDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedResponseDto<Voter>> {
    return await this.voterService.getVotersByStatus(
      false,
      paginationQueryDto,
      user,
    );
  }

  @Get('list/search-by-tracking-filter')
  @Permission('voters:read')
  @ApiOperation({
    summary: 'Search voters by identification within a tracking filter',
    description:
      'Search for voters by identification (cédula) within a specific tracking filter (expected, registered, or pending)',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  async searchVotersByTrackingFilter(
    @Query() searchTrackingFilterDto: SearchTrackingFilterDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedResponseDto<Voter>> {
    return await this.voterService.searchVotersByTrackingFilter(
      searchTrackingFilterDto.status,
      searchTrackingFilterDto.identification,
      searchTrackingFilterDto,
      user,
    );
  }

  @Get(':id')
  @Permission('voters:read')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Voter ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Get voter by ID',
    description: 'Returns a specific voter',
  })
  @ApiResponse({
    status: 200,
    description: 'Voter found',
  })
  async findOne(@Param('id') id: string): Promise<Voter | null> {
    return await this.voterService.findOneWithAllRelations(+id);
  }

  @Patch(':id')
  @Permission('voters:update')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Voter ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Update a voter',
    description: 'Update voter information',
  })
  @ApiBody({
    type: UpdateVoterDto,
    description: 'Voter data to update',
    examples: {
      example1: {
        value: {
          phone: '+57 312 999 8888',
        },
        description: 'Example of updating voter phone',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Voter updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateVoterDto: UpdateVoterDto,
    @CurrentUser() user: any,
  ): Promise<Voter | null> {
    return await this.voterService.update(
      +id,
      updateVoterDto,
      user?.organizationId,
    );
  }

  @Delete(':id')
  @Permission('voters:delete')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Voter ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Delete a voter',
    description: 'Delete a voter from the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Voter deleted successfully',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.voterService.remove(+id);
  }

  @Post(':voterId/assign-candidate')
  @Permission(['voters:create', 'voters:manage'])
  @ApiParam({
    name: 'voterId',
    type: 'number',
    description: 'Voter ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Assign candidates to voter',
    description:
      'Associate one or more candidates (and a leader) with a voter in the system',
  })
  @ApiBody({
    type: AssignCandidateDto,
    description: 'Candidates and leader to assign',
    examples: {
      example1: {
        value: {
          candidate_ids: [2, 3],
          leader_id: 1,
        },
        description:
          'Example of assigning candidate IDs 2 and 3 and leader ID 1 to voter',
      },
      example2: {
        value: {
          candidate_ids: [2],
          leader_id: 1,
        },
        description:
          'Example of assigning single candidate ID 2 with leader ID 1 to voter',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Candidates assigned successfully',
    schema: {
      example: [
        {
          id: 1,
          voter_id: 1,
          candidate_id: 2,
          leader_id: 1,
          candidate: {
            id: 2,
            name: 'Carlos López',
          },
          leader: {
            id: 1,
            name: 'Juan Pérez',
          },
          createdAt: '2024-01-27T10:30:00Z',
          updatedAt: '2024-01-27T10:30:00Z',
        },
        {
          id: 2,
          voter_id: 1,
          candidate_id: 3,
          leader_id: 1,
          candidate: {
            id: 3,
            name: 'María García',
          },
          leader: {
            id: 1,
            name: 'Juan Pérez',
          },
          createdAt: '2024-01-27T10:30:00Z',
          updatedAt: '2024-01-27T10:30:00Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Voter, candidate or leader not found',
  })
  async assignCandidates(
    @Param('voterId') voterId: string,
    @Body() assignCandidateDto: AssignCandidateDto,
  ): Promise<CandidateVoter[]> {
    return await this.voterService.updateAssignedCandidates(
      +voterId,
      assignCandidateDto,
    );
  }

  @Get(':voterId/assign-candidate')
  @Permission('voters:read')
  @ApiParam({
    name: 'voterId',
    type: 'number',
    description: 'Voter ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Get assigned candidates for voter',
    description: 'Retrieve all candidates and leader assigned to a voter',
  })
  @ApiResponse({
    status: 200,
    description: 'Assignments retrieved successfully',
    schema: {
      example: [
        {
          id: 1,
          voter_id: 1,
          candidate_id: 2,
          leader_id: 1,
          candidate: {
            id: 2,
            name: 'Carlos López',
          },
          leader: {
            id: 1,
            name: 'Juan Pérez',
          },
          createdAt: '2024-01-27T10:30:00Z',
          updatedAt: '2024-01-27T10:30:00Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'No assignments found for this voter',
  })
  async getAssignedCandidates(
    @Param('voterId') voterId: string,
  ): Promise<CandidateVoter[]> {
    return await this.voterService.getAssignedCandidates(+voterId);
  }

  @Patch(':voterId/assign-candidate')
  @Permission(['voters:create', 'voters:update'])
  @ApiParam({
    name: 'voterId',
    type: 'number',
    description: 'Voter ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Update assigned candidates for voter',
    description:
      'Update the candidates and leader assigned to a voter. Replaces all previous assignments.',
  })
  @ApiBody({
    type: AssignCandidateDto,
    description: 'Candidates and leader to assign',
    examples: {
      example1: {
        value: {
          candidate_ids: [2, 3],
          leader_id: 2,
        },
        description: 'Example of updating with candidates 2 and 3 and leader 2',
      },
      example2: {
        value: {
          candidate_ids: [3],
          leader_id: 2,
        },
        description: 'Example of updating with single candidate 3 and leader 2',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Assignments updated successfully',
    schema: {
      example: [
        {
          id: 1,
          voter_id: 1,
          candidate_id: 2,
          leader_id: 2,
          candidate: {
            id: 2,
            name: 'Carlos López',
          },
          leader: {
            id: 2,
            name: 'Pedro López',
          },
          createdAt: '2024-01-27T10:30:00Z',
          updatedAt: '2024-01-27T11:45:00Z',
        },
        {
          id: 5,
          voter_id: 1,
          candidate_id: 3,
          leader_id: 2,
          candidate: {
            id: 3,
            name: 'María García',
          },
          leader: {
            id: 2,
            name: 'Pedro López',
          },
          createdAt: '2024-01-27T10:35:00Z',
          updatedAt: '2024-01-27T11:45:00Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Voter, candidate or leader not found',
  })
  async updateAssignedCandidates(
    @Param('voterId') voterId: string,
    @Body() assignCandidateDto: AssignCandidateDto,
  ): Promise<CandidateVoter[]> {
    return await this.voterService.updateAssignedCandidates(
      +voterId,
      assignCandidateDto,
    );
  }

  @Get('report/general')
  @Permission('reports:read')
  @ApiOperation({
    summary: 'Get voter report with filters and aggregations',
    description:
      'Get a detailed report of voters with dynamic filters and aggregations. Pagination is based on unique voters (20 per page by default). Campaign admins and digitadores will only see voters from their organization.',
  })
  @ApiQuery({
    name: 'gender',
    type: 'string',
    required: false,
    description: 'Filter by gender (M, F, etc)',
  })
  @ApiQuery({
    name: 'leaderId',
    type: 'number',
    required: false,
    description: 'Filter by leader ID',
  })
  @ApiQuery({
    name: 'candidateId',
    type: 'number',
    required: false,
    description: 'Filter by candidate ID',
  })
  @ApiQuery({
    name: 'corporationId',
    type: 'number',
    required: false,
    description: 'Filter by corporation ID',
  })
  @ApiQuery({
    name: 'departmentId',
    type: 'number',
    required: false,
    description: 'Filter by department ID',
  })
  @ApiQuery({
    name: 'municipalityId',
    type: 'number',
    required: false,
    description: 'Filter by municipality ID',
  })
  @ApiQuery({
    name: 'votingBoothId',
    type: 'number',
    required: false,
    description: 'Filter by voting booth ID',
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'votingTableId',
    type: 'number',
    required: false,
    description: 'Filter by voting table ID',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Unique voters per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Voter report retrieved successfully',
  })
  async getVoterReport(
    @Query() filters: VoterReportFilterDto,
    @CurrentUser() user?: any,
  ): Promise<any> {
    return await this.voterService.getVoterReport(filters, user);
  }

  @Get('report/analysis')
  @Permission('reports:read')
  @ApiOperation({
    summary: 'Get analysis report grouped by voting table',
    description:
      'Get voting analysis data grouped by mesa (voting table) with metrics like total registered and total voted voters.',
  })
  @ApiQuery({
    name: 'departmentId',
    type: 'number',
    required: false,
    description: 'Filter by department ID',
  })
  @ApiQuery({
    name: 'municipalityId',
    type: 'number',
    required: false,
    description: 'Filter by municipality ID',
  })
  @ApiQuery({
    name: 'votingBoothId',
    type: 'number',
    required: false,
    description: 'Filter by voting booth ID',
  })
  @ApiQuery({
    name: 'votingTableId',
    type: 'number',
    required: false,
    description: 'Filter by voting table ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Analysis report retrieved successfully',
    schema: {
      example: [
        {
          departamento: 'SUCRE',
          municipio: 'OVEJAS',
          puestoVotacion: 'CABECERA MUNICIPAL',
          totalPuesto: 340,
          mesa: '1',
          totalRegistrado: 20,
          totalVotado: 18,
        },
      ],
    },
  })
  async getAnalysisReport(
    @Query() filters: AnalysisReportFilterDto,
    @CurrentUser() user?: any,
  ): Promise<any[]> {
    return await this.voterService.getAnalysisReport(filters, user);
  }

  @Post('register-vote')
  @Permission('voters:update')
  @ApiOperation({
    summary: 'Register vote for a voter',
    description:
      'Register that a voter has voted by their identification number. The voter status changes from "Pending" to "Registered".',
  })
  @ApiBody({
    type: RegisterVoteDto,
    description: 'Voter identification number',
    examples: {
      example1: {
        value: { identification: '1234567890' },
        description: 'Example of registering a vote',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Vote registered successfully',
    schema: {
      example: {
        id: 1,
        firstName: 'Juan',
        lastName: 'Pérez',
        identification: '1234567890',
        hasVoted: true,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Voter not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Voter has already voted',
  })
  async registerVote(
    @Body() registerVoteDto: RegisterVoteDto,
    @CurrentUser() user: any,
  ): Promise<Partial<Voter>> {
    const voter = await this.voterService.registerVote(
      registerVoteDto.identification,
      user,
    );
    return {
      id: voter.id,
      firstName: voter.firstName,
      lastName: voter.lastName,
      identification: voter.identification,
      hasVoted: voter.hasVoted,
    };
  }

  @Post('unregister-vote')
  @Permission('voters:update')
  @ApiOperation({
    summary: 'Unregister vote for a voter',
    description:
      'Remove a voter vote by their identification number. Changes the voter status from "Registered" back to "Pending".',
  })
  @ApiBody({
    type: RegisterVoteDto,
    description: 'Voter identification number',
    examples: {
      example1: {
        value: { identification: '1234567890' },
        description: 'Example of unregistering a vote',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Vote unregistered successfully',
    schema: {
      example: {
        id: 1,
        firstName: 'Juan',
        lastName: 'Pérez',
        identification: '1234567890',
        hasVoted: false,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Voter not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Voter has not voted',
  })
  async unregisterVote(
    @Body() registerVoteDto: RegisterVoteDto,
    @CurrentUser() user: any,
  ): Promise<Partial<Voter>> {
    const voter = await this.voterService.unregisterVote(
      registerVoteDto.identification,
      user,
    );
    return {
      id: voter.id,
      firstName: voter.firstName,
      lastName: voter.lastName,
      identification: voter.identification,
      hasVoted: voter.hasVoted,
    };
  }
}
