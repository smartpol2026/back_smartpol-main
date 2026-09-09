import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VotingBoothService } from './voting-booth.service';
import { Permission } from '../../permissions/permission.decorator';
import { CreateVotingBoothDto } from './dto/create-voting-booth.dto';
import { UpdateVotingBoothDto } from './dto/update-voting-booth.dto';
import { VotingBoothResponseDto } from './dto/voting-booth-response.dto';

@ApiTags('Voting Booths')
@Controller('voting-booths')
export class VotingBoothController {
  constructor(private readonly votingBoothService: VotingBoothService) {}

  @Post()
  @Permission('voting-booths:create')
  @ApiOperation({ summary: 'Crear nuevo puesto de votación' })
  @ApiResponse({
    status: 201,
    description: 'Puesto creado exitosamente',
    type: VotingBoothResponseDto,
  })
  create(@Body() createVotingBoothDto: CreateVotingBoothDto) {
    return this.votingBoothService.create(createVotingBoothDto);
  }

  @Get()
  @Permission('voting-booths:read')
  @ApiOperation({ summary: 'Obtener todos los puestos de votación' })
  @ApiResponse({
    status: 200,
    description: 'Lista de puestos',
    type: [VotingBoothResponseDto],
  })
  findAll() {
    return this.votingBoothService.findAll();
  }

  @Get('by-municipality/:municipalityId')
  @Permission('voting-booths:read')
  @ApiOperation({ summary: 'Obtener puestos por municipio' })
  @ApiResponse({
    status: 200,
    description: 'Puestos del municipio',
    type: [VotingBoothResponseDto],
  })
  findByMunicipality(
    @Param('municipalityId', ParseIntPipe) municipalityId: number,
  ) {
    return this.votingBoothService.findByMunicipality(municipalityId);
  }

  @Get(':id')
  @Permission('voting-booths:read')
  @ApiOperation({ summary: 'Obtener puesto por ID' })
  @ApiResponse({
    status: 200,
    description: 'Puesto encontrado',
    type: VotingBoothResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.votingBoothService.findOne(id);
  }

  @Patch(':id')
  @Permission('voting-booths:update')
  @ApiOperation({ summary: 'Actualizar puesto de votación' })
  @ApiResponse({
    status: 200,
    description: 'Puesto actualizado',
    type: VotingBoothResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVotingBoothDto: UpdateVotingBoothDto,
  ) {
    return this.votingBoothService.update(id, updateVotingBoothDto);
  }

  @Delete(':id')
  @Permission('voting-booths:delete')
  @ApiOperation({ summary: 'Eliminar puesto de votación' })
  @ApiResponse({ status: 200, description: 'Puesto eliminado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.votingBoothService.remove(id);
  }
}
