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
import { CampaignsService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { Campaign } from '../../database/entities/campaigns.entity';
import { Permission } from '../../permissions/permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('Campaigns')
@Controller('campaigns')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @Permission(['campaigns:create', 'campaigns:manage'])
  @ApiOperation({
    summary: 'Create a new campaign',
    description:
      'Register a new political campaign with organization, dates, and optional user assignments. Organization admins will have their organization automatically assigned.',
  })
  @ApiBody({
    type: CreateCampaignDto,
    description: 'Campaign data',
    examples: {
      example1: {
        value: {
          name: 'Campaña Electoral 2024',
          description: 'Campaña municipal para el año 2024',
          startDate: '2024-01-15',
          endDate: '2024-12-31',
          organizationId: 1,
          userIds: [1, 2, 3],
        },
        description: 'Example of creating a campaign with user assignments',
      },
      example2: {
        value: {
          name: 'Campaña Presidencial 2024',
          description: 'Campaña presidencial',
          startDate: '2024-06-01',
          endDate: '2024-08-15',
          organizationId: 1,
        },
        description: 'Example of creating a campaign without user assignments',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Campaign created successfully',
    schema: {
      example: {
        id: 1,
        name: 'Campaña Electoral 2024',
        description: 'Campaña municipal para el año 2024',
        startDate: '2024-01-15',
        endDate: '2024-12-31',
        status: true,
        organizationId: 1,
        organization: {
          id: 1,
          name: 'Organización A',
        },
        candidates: [],
        leaders: [],
        campaignUsers: [
          {
            id: 1,
            campaignId: 1,
            userId: 1,
            user: {
              id: 1,
              name: 'Juan Pérez',
              email: 'juan@example.com',
            },
          },
        ],
        createdAt: '2026-02-06T12:00:00Z',
        updatedAt: '2026-02-06T12:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async create(
    @Body() createCampaignDto: CreateCampaignDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.campaignsService.create(createCampaignDto, currentUser);
  }

  @Get('me/my-campaigns')
  @Permission('campaigns:read')
  @ApiOperation({
    summary: 'Get authenticated user campaigns',
    description:
      'Returns campaigns for the authenticated user. Organization admins see their organization campaigns, super admins see all campaigns.',
  })
  @ApiResponse({
    status: 200,
    description: 'User campaigns retrieved successfully',
  })
  async getUserCampaigns(@CurrentUser() currentUser: User) {
    return this.campaignsService.findByUser(currentUser);
  }

  @Get('organization/:organizationId')
  @Permission('campaigns:read')
  @ApiParam({
    name: 'organizationId',
    type: 'number',
    description: 'Organization ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Get campaigns by organization',
    description: 'Returns all campaigns for a specific organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaigns of the organization',
    schema: {
      example: [
        {
          id: 1,
          name: 'Campaña Electoral 2024',
          description: 'Campaña municipal para el año 2024',
          startDate: '2024-01-15',
          endDate: '2024-12-31',
          status: true,
          organizationId: 1,
          candidates: [],
          leaders: [],
          campaignUsers: [],
          createdAt: '2026-02-06T12:00:00Z',
          updatedAt: '2026-02-06T12:00:00Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to view this organization campaigns',
  })
  async findByOrganization(
    @Param('organizationId') organizationId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.campaignsService.findByOrganization(
      +organizationId,
      currentUser,
    );
  }

  @Get()
  @Permission('campaigns:read')
  @ApiOperation({
    summary: 'Get all campaigns with pagination',
    description:
      'Returns a list of all campaigns with pagination. Organization admins will only see campaigns from their organization.',
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
    description: 'Search term for campaign name or description',
  })
  @ApiResponse({
    status: 200,
    description: 'List of campaigns',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'Campaña Electoral 2024',
            description: 'Campaña municipal para el año 2024',
            startDate: '2024-01-15',
            endDate: '2024-12-31',
            status: true,
            organizationId: 1,
            organization: {
              id: 1,
              name: 'Organización A',
            },
            candidates: [],
            leaders: [],
            campaignUsers: [],
            createdAt: '2026-02-06T12:00:00Z',
            updatedAt: '2026-02-06T12:00:00Z',
          },
        ],
        page: 1,
        limit: 10,
        total: 1,
        pages: 1,
      },
    },
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
    @CurrentUser() currentUser: User,
  ) {
    return this.campaignsService.findAll(
      currentUser,
      parseInt(page) || 1,
      parseInt(limit) || 10,
      search,
    );
  }

  @Get(':id/candidates')
  @Permission('campaigns:read')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Campaign ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Get candidates of a campaign',
    description: 'Returns all candidates registered in a specific campaign',
  })
  @ApiResponse({
    status: 200,
    description: 'List of candidates in the campaign',
    schema: {
      example: [
        {
          id: 1,
          name: 'Juan Duarte',
          party: 'Partido Colombiano',
          number: 1,
          corporation_id: 1,
        },
      ],
    },
  })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCandidates(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const campaign = await this.campaignsService.findOne(+id, currentUser);
    return campaign.candidates || [];
  }

  @Get(':id/leaders')
  @Permission('campaigns:read')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Campaign ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Get leaders of a campaign',
    description: 'Returns all leaders working in a specific campaign',
  })
  @ApiResponse({
    status: 200,
    description: 'List of leaders in the campaign',
    schema: {
      example: [
        {
          id: 1,
          name: 'Juan López',
          document: '12345678',
          municipality: 'Bogotá',
          phone: '+57 312 123 4567',
        },
      ],
    },
  })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getLeaders(@Param('id') id: string, @CurrentUser() currentUser: User) {
    const campaign = await this.campaignsService.findOne(+id, currentUser);
    return campaign.leaders || [];
  }

  @Get(':id')
  @Permission('campaigns:read')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Campaign ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Get campaign by ID',
    description:
      'Returns a specific campaign with all associated candidates, leaders, and users',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign found',
    schema: {
      example: {
        id: 1,
        name: 'Campaña Electoral 2024',
        description: 'Campaña municipal para el año 2024',
        startDate: '2024-01-15',
        endDate: '2024-12-31',
        status: true,
        organizationId: 1,
        organization: {
          id: 1,
          name: 'Organización A',
        },
        candidates: [
          {
            id: 1,
            name: 'Juan Duarte',
            party: 'Partido Colombiano',
            number: 1,
            corporation_id: 1,
          },
          {
            id: 2,
            name: 'María García',
            party: 'Partido Liberal',
            number: 2,
            corporation_id: 1,
          },
        ],
        leaders: [
          {
            id: 1,
            name: 'Juan López',
            document: '12345678',
            municipality: 'Bogotá',
            phone: '+57 312 123 4567',
          },
          {
            id: 2,
            name: 'María Rodríguez',
            document: '87654321',
            municipality: 'Medellín',
            phone: '+57 312 987 6543',
          },
        ],
        campaignUsers: [
          {
            id: 1,
            campaignId: 1,
            userId: 1,
            user: {
              id: 1,
              name: 'Juan Pérez',
              email: 'juan@example.com',
            },
          },
        ],
        createdAt: '2026-02-06T12:00:00Z',
        updatedAt: '2026-02-06T12:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.campaignsService.findOne(+id, currentUser);
  }

  @Patch(':id')
  @Permission(['campaigns:update', 'campaigns:manage'])
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Campaign ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Update a campaign',
    description:
      'Update campaign information including name, description, dates, and user assignments',
  })
  @ApiBody({
    type: UpdateCampaignDto,
    description: 'Campaign data to update',
    examples: {
      example1: {
        value: {
          name: 'Campaña Electoral 2024 - Actualizada',
        },
        description: 'Update only campaign name',
      },
      example2: {
        value: {
          name: 'Campaña Electoral 2024 - Actualizada',
          description: 'Nueva descripción',
          endDate: '2024-11-30',
          userIds: [1, 2, 3, 4],
        },
        description: 'Update campaign with new user assignments',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign updated successfully',
    schema: {
      example: {
        id: 1,
        name: 'Campaña Electoral 2024 - Actualizada',
        description: 'Nueva descripción',
        startDate: '2024-01-15',
        endDate: '2024-11-30',
        status: true,
        organizationId: 1,
        candidates: [],
        leaders: [],
        campaignUsers: [
          {
            id: 1,
            campaignId: 1,
            userId: 1,
          },
          {
            id: 2,
            campaignId: 1,
            userId: 2,
          },
        ],
        createdAt: '2026-02-06T12:00:00Z',
        updatedAt: '2026-02-06T13:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async update(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.campaignsService.update(+id, updateCampaignDto, currentUser);
  }

  @Delete(':id')
  @Permission(['campaigns:delete', 'campaigns:manage'])
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Campaign ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Delete a campaign',
    description: 'Delete a campaign from the system',
  })
  @ApiResponse({ status: 200, description: 'Campaign deleted successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.campaignsService.remove(+id, currentUser);
  }

  @Post(':campaignId/users/:userId')
  @Permission('campaigns:update')
  @ApiParam({
    name: 'campaignId',
    type: 'number',
    description: 'Campaign ID',
    example: 1,
  })
  @ApiParam({
    name: 'userId',
    type: 'number',
    description: 'User ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Assign user to campaign',
    description: 'Assigns a user to work in a specific campaign',
  })
  @ApiResponse({
    status: 201,
    description: 'User assigned to campaign successfully',
    schema: {
      example: {
        id: 1,
        campaignId: 1,
        userId: 1,
        user: {
          id: 1,
          name: 'Juan Pérez',
          email: 'juan@example.com',
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Campaign or user not found' })
  async assignUserToCampaign(
    @Param('campaignId') campaignId: string,
    @Param('userId') userId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.campaignsService.assignUsersTooCampaign(
      +campaignId,
      [+userId],
      currentUser,
    );
  }

  @Delete(':campaignId/users/:userId')
  @Permission('campaigns:update')
  @ApiParam({
    name: 'campaignId',
    type: 'number',
    description: 'Campaign ID',
    example: 1,
  })
  @ApiParam({
    name: 'userId',
    type: 'number',
    description: 'User ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Remove user from campaign',
    description: 'Removes a user from a campaign',
  })
  @ApiResponse({
    status: 200,
    description: 'User removed from campaign successfully',
  })
  @ApiResponse({ status: 404, description: 'Campaign or user not found' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async removeUserFromCampaign(
    @Param('campaignId') campaignId: string,
    @Param('userId') userId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.campaignsService.removeUserFromCampaign(
      +campaignId,
      +userId,
      currentUser,
    );
  }
}
