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
import { MunicipalityService } from './municipality.service';
import { Permission } from '../../permissions/permission.decorator';
import { CreateMunicipalityDto } from './dto/create-municipality.dto';
import { UpdateMunicipalityDto } from './dto/update-municipality.dto';
import { Municipality } from '../../database/entities/municipality.entity';

@ApiTags('Municipalities')
@Controller('municipalities')
export class MunicipalityController {
  constructor(private readonly municipalityService: MunicipalityService) {}

  @Post()
  @Permission('municipalities:manage')
  @ApiOperation({
    summary: 'Create a new municipality',
    description: 'Register a new municipality in the system',
  })
  @ApiBody({
    type: CreateMunicipalityDto,
    description: 'Municipality data',
    examples: {
      example1: {
        value: {
          name: 'Ovejas',
          code: '70001',
          departmentId: 1,
        },
        description: 'Example of creating a municipality',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Municipality created successfully',
    schema: {
      example: {
        id: 1,
        name: 'Ovejas',
        code: '70001',
        departmentId: 1,
        createdAt: '2024-01-28T10:30:00Z',
        updatedAt: '2024-01-28T10:30:00Z',
      },
    },
  })
  async create(
    @Body() createMunicipalityDto: CreateMunicipalityDto,
  ): Promise<Municipality> {
    return await this.municipalityService.create(createMunicipalityDto);
  }

  @Get()
  @Permission('municipalities:read')
  @ApiOperation({
    summary: 'Get all municipalities',
    description:
      'Returns the complete list of municipalities with their departments',
  })
  @ApiResponse({
    status: 200,
    description: 'List of municipalities retrieved successfully',
    schema: {
      example: [
        {
          id: 1,
          name: 'Ovejas',
          code: '70001',
          departmentId: 1,
          createdAt: '2024-01-28T10:30:00Z',
          updatedAt: '2024-01-28T10:30:00Z',
        },
      ],
    },
  })
  async findAll(): Promise<Municipality[]> {
    return await this.municipalityService.findAll();
  }

  @Get('by-department/:departmentId')
  @Permission('municipalities:read')
  @ApiParam({
    name: 'departmentId',
    type: 'number',
    description: 'Department ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Get municipalities by department',
    description: 'Returns all municipalities of a specific department',
  })
  @ApiResponse({
    status: 200,
    description: 'List of municipalities retrieved successfully',
    schema: {
      example: [
        {
          id: 1,
          name: 'Ovejas',
          code: '70001',
          departmentId: 1,
          createdAt: '2024-01-28T10:30:00Z',
          updatedAt: '2024-01-28T10:30:00Z',
        },
      ],
    },
  })
  async findByDepartment(
    @Param('departmentId') departmentId: string,
  ): Promise<Municipality[]> {
    return await this.municipalityService.findByDepartment(+departmentId);
  }

  @Get(':id')
  @Permission('municipalities:read')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Municipality ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Get municipality by ID',
    description: 'Returns a specific municipality',
  })
  @ApiResponse({
    status: 200,
    description: 'Municipality found',
    schema: {
      example: {
        id: 1,
        name: 'Ovejas',
        code: '70001',
        departmentId: 1,
        createdAt: '2024-01-28T10:30:00Z',
        updatedAt: '2024-01-28T10:30:00Z',
      },
    },
  })
  async findOne(@Param('id') id: string): Promise<Municipality | null> {
    return await this.municipalityService.findOne(+id);
  }

  @Patch(':id')
  @Permission('municipalities:manage')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Municipality ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Update a municipality',
    description: 'Update municipality information',
  })
  @ApiBody({
    type: UpdateMunicipalityDto,
    description: 'Municipality data to update',
    examples: {
      example1: {
        value: {
          name: 'Ovejas',
        },
        description: 'Example of updating municipality name',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Municipality updated successfully',
    schema: {
      example: {
        id: 1,
        name: 'Ovejas',
        code: '70001',
        departmentId: 1,
        createdAt: '2024-01-28T10:30:00Z',
        updatedAt: '2024-01-28T10:30:01Z',
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateMunicipalityDto: UpdateMunicipalityDto,
  ): Promise<Municipality | null> {
    return await this.municipalityService.update(+id, updateMunicipalityDto);
  }

  @Delete(':id')
  @Permission('municipalities:manage')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Municipality ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Delete a municipality',
    description: 'Delete a municipality from the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Municipality deleted successfully',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.municipalityService.remove(+id);
  }
}
