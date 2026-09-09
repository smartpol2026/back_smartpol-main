import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CorporationService } from './corporation.service';
import { Permission } from '../../permissions/permission.decorator';
import { CreateCorporationDto } from './dto/create-corporation.dto';
import { UpdateCorporationDto } from './dto/update-corporation.dto';
import { Corporation } from '../../database/entities/corporation.entity';

@ApiTags('Corporations')
@Controller('corporations')
export class CorporationController {
  constructor(private readonly corporationService: CorporationService) {}

  @Post()
  @Permission('corporations:manage')
  @ApiOperation({
    summary: 'Create a new corporation',
    description: 'Register a new corporation in the system',
  })
  @ApiBody({
    type: CreateCorporationDto,
    description: 'Corporation data',
    examples: {
      example1: {
        value: {
          name: 'Corporación XYZ',
        },
        description: 'Example of creating a corporation',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Corporation created successfully',
    schema: {
      example: {
        id: 1,
        name: 'Corporación XYZ',
        createdAt: '2024-01-27T10:30:00Z',
        updatedAt: '2024-01-27T10:30:00Z',
      },
    },
  })
  async create(
    @Body() createCorporationDto: CreateCorporationDto,
  ): Promise<Corporation> {
    return await this.corporationService.create(createCorporationDto);
  }

  @Get()
  @Permission('corporations:read')
  @ApiOperation({
    summary: 'Get all corporations',
    description: 'Returns the complete list of registered corporations',
  })
  @ApiResponse({
    status: 200,
    description: 'List of corporations retrieved successfully',
    schema: {
      example: [
        {
          id: 1,
          name: 'Corporación XYZ',
          createdAt: '2024-01-27T10:30:00Z',
          updatedAt: '2024-01-27T10:30:00Z',
        },
      ],
    },
  })
  async findAll(): Promise<Corporation[]> {
    return await this.corporationService.findAll();
  }

  @Get(':id')
  @Permission('corporations:read')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Corporation ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Get corporation by ID',
    description: 'Returns a specific corporation',
  })
  @ApiResponse({
    status: 200,
    description: 'Corporation found',
    schema: {
      example: {
        id: 1,
        name: 'Corporación XYZ',
        createdAt: '2024-01-27T10:30:00Z',
        updatedAt: '2024-01-27T10:30:00Z',
      },
    },
  })
  async findOne(@Param('id') id: string): Promise<Corporation | null> {
    return await this.corporationService.findOne(+id);
  }

  @Patch(':id')
  @Permission('corporations:manage')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Corporation ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Update a corporation',
    description: 'Update corporation information',
  })
  @ApiBody({
    type: UpdateCorporationDto,
    description: 'Corporation data to update',
    examples: {
      example1: {
        value: {
          name: 'Corporación ABC Updated',
        },
        description: 'Example of updating corporation name',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Corporation updated successfully',
    schema: {
      example: {
        id: 1,
        name: 'Corporación ABC Updated',
        createdAt: '2024-01-27T10:30:00Z',
        updatedAt: '2024-01-27T10:30:01Z',
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateCorporationDto: UpdateCorporationDto,
  ): Promise<Corporation | null> {
    return await this.corporationService.update(+id, updateCorporationDto);
  }

  @Delete(':id')
  @Permission('corporations:manage')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Corporation ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Delete a corporation',
    description: 'Delete a corporation from the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Corporation deleted successfully',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.corporationService.remove(+id);
  }
}
