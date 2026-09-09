import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrganizationsService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateOrganizationWithAdminDto } from './dto/create-organization-with-admin.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from '../../database/entities/organizations.entity';
import { Permission } from '../../permissions/permission.decorator';

@ApiTags('organizations')
@Controller('organizations')
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Permission('organizations:create')
  @ApiOperation({ summary: 'Crear una nueva organización' })
  @ApiResponse({
    status: 201,
    description: 'Organización creada exitosamente',
    type: Organization,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No tiene permiso' })
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Post('with-admin')
  @Permission('organizations:create')
  @ApiOperation({ summary: 'Crear organización con administrador' })
  @ApiResponse({
    status: 201,
    description: 'Organización y administrador creados exitosamente',
    type: Organization,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No tiene permiso' })
  createWithAdmin(
    @Body() createOrganizationWithAdminDto: CreateOrganizationWithAdminDto,
  ) {
    return this.organizationsService.createOrganizationWithAdmin(
      createOrganizationWithAdminDto,
    );
  }

  @Get()
  @Permission('organizations:read')
  @ApiOperation({ summary: 'Obtener todas las organizaciones' })
  @ApiResponse({
    status: 200,
    description: 'Lista de organizaciones',
    type: [Organization],
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No tiene permiso' })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.organizationsService.findAll(
      parseInt(page),
      parseInt(limit),
      search,
    );
  }

  @Get(':id')
  @Permission('organizations:read')
  @ApiOperation({ summary: 'Obtener una organización por ID' })
  @ApiResponse({
    status: 200,
    description: 'Organización encontrada',
    type: Organization,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No tiene permiso' })
  @ApiResponse({ status: 404, description: 'Organización no encontrada' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(+id);
  }

  @Patch(':id')
  @Permission('organizations:update')
  @ApiOperation({ summary: 'Actualizar una organización' })
  @ApiResponse({
    status: 200,
    description: 'Organización actualizada exitosamente',
    type: Organization,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No tiene permiso' })
  @ApiResponse({ status: 404, description: 'Organización no encontrada' })
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(+id, updateOrganizationDto);
  }

  @Delete(':id')
  @Permission('organizations:delete')
  @ApiOperation({ summary: 'Eliminar una organización' })
  @ApiResponse({
    status: 200,
    description: 'Organización eliminada exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No tiene permiso' })
  @ApiResponse({ status: 404, description: 'Organización no encontrada' })
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(+id);
  }
}
