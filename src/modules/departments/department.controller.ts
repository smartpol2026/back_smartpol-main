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
import { DepartmentService } from './department.service';
import { Permission } from '../../permissions/permission.decorator';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from '../../database/entities/department.entity';

@ApiTags('Departments')
@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @Permission('departments:manage')
  @ApiOperation({
    summary: 'Create a new department',
    description: 'Register a new department in the system',
  })
  @ApiBody({
    type: CreateDepartmentDto,
    description: 'Department data',
    examples: {
      example1: {
        value: {
          name: 'Sucre',
          code: '70',
        },
        description: 'Example of creating a department',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Department created successfully',
    schema: {
      example: {
        id: 1,
        name: 'Sucre',
        code: '70',
        createdAt: '2024-01-28T10:30:00Z',
        updatedAt: '2024-01-28T10:30:00Z',
      },
    },
  })
  async create(
    @Body() createDepartmentDto: CreateDepartmentDto,
  ): Promise<Department> {
    return await this.departmentService.create(createDepartmentDto);
  }

  @Get()
  @Permission('departments:read')
  @ApiOperation({
    summary: 'Get all departments',
    description:
      'Returns the complete list of departments with their municipalities',
  })
  @ApiResponse({
    status: 200,
    description: 'List of departments retrieved successfully',
    schema: {
      example: [
        {
          id: 1,
          name: 'Sucre',
          code: '70',
          municipalities: [
            {
              id: 1,
              name: 'Ovejas',
              code: '70001',
              departmentId: 1,
              createdAt: '2024-01-28T10:30:00Z',
              updatedAt: '2024-01-28T10:30:00Z',
            },
          ],
          createdAt: '2024-01-28T10:30:00Z',
          updatedAt: '2024-01-28T10:30:00Z',
        },
      ],
    },
  })
  async findAll(): Promise<Department[]> {
    return await this.departmentService.findAll();
  }

  @Get(':id')
  @Permission('departments:read')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Department ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Get department by ID',
    description: 'Returns a specific department with its municipalities',
  })
  @ApiResponse({
    status: 200,
    description: 'Department found',
    schema: {
      example: {
        id: 1,
        name: 'Sucre',
        code: '70',
        municipalities: [
          {
            id: 1,
            name: 'Ovejas',
            code: '70001',
            departmentId: 1,
            createdAt: '2024-01-28T10:30:00Z',
            updatedAt: '2024-01-28T10:30:00Z',
          },
        ],
        createdAt: '2024-01-28T10:30:00Z',
        updatedAt: '2024-01-28T10:30:00Z',
      },
    },
  })
  async findOne(@Param('id') id: string): Promise<Department | null> {
    return await this.departmentService.findOne(+id);
  }

  @Patch(':id')
  @Permission('departments:manage')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Department ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Update a department',
    description: 'Update department information',
  })
  @ApiBody({
    type: UpdateDepartmentDto,
    description: 'Department data to update',
    examples: {
      example1: {
        value: {
          name: 'Sucre',
        },
        description: 'Example of updating department name',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Department updated successfully',
    schema: {
      example: {
        id: 1,
        name: 'Sucre',
        code: '70',
        municipalities: [],
        createdAt: '2024-01-28T10:30:00Z',
        updatedAt: '2024-01-28T10:30:01Z',
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department | null> {
    return await this.departmentService.update(+id, updateDepartmentDto);
  }

  @Delete(':id')
  @Permission('departments:manage')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Department ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Delete a department',
    description:
      'Delete a department and all its municipalities from the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Department deleted successfully',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.departmentService.remove(+id);
  }
}
