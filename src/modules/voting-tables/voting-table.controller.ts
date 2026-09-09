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
import { VotingTableService } from './voting-table.service';
import { Permission } from '../../permissions/permission.decorator';
import { CreateVotingTableDto } from './dto/create-voting-table.dto';
import { UpdateVotingTableDto } from './dto/update-voting-table.dto';
import { VotingTableResponseDto } from './dto/voting-table-response.dto';

@ApiTags('Voting Tables')
@Controller('voting-tables')
export class VotingTableController {
  constructor(private readonly votingTableService: VotingTableService) {}

  @Post()
  @Permission('voting-tables:create')
  @ApiOperation({ summary: 'Crear nueva mesa de votación' })
  @ApiResponse({
    status: 201,
    description: 'Mesa creada exitosamente',
    type: VotingTableResponseDto,
  })
  create(@Body() createVotingTableDto: CreateVotingTableDto) {
    return this.votingTableService.create(createVotingTableDto);
  }

  @Get()
  @Permission('voting-tables:read')
  @ApiOperation({ summary: 'Obtener todas las mesas de votación' })
  @ApiResponse({
    status: 200,
    description: 'Lista de mesas',
    type: [VotingTableResponseDto],
  })
  findAll() {
    return this.votingTableService.findAll();
  }

  @Get('by-booth/:votingBoothId')
  @Permission('voting-tables:read')
  @ApiOperation({ summary: 'Obtener mesas por puesto de votación' })
  @ApiResponse({
    status: 200,
    description: 'Mesas del puesto',
    type: [VotingTableResponseDto],
  })
  findByVotingBooth(
    @Param('votingBoothId', ParseIntPipe) votingBoothId: number,
  ) {
    return this.votingTableService.findByVotingBooth(votingBoothId);
  }

  @Get(':id')
  @Permission('voting-tables:read')
  @ApiOperation({ summary: 'Obtener mesa por ID' })
  @ApiResponse({
    status: 200,
    description: 'Mesa encontrada',
    type: VotingTableResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.votingTableService.findOne(id);
  }

  @Patch(':id')
  @Permission('voting-tables:update')
  @ApiOperation({ summary: 'Actualizar mesa de votación' })
  @ApiResponse({
    status: 200,
    description: 'Mesa actualizada',
    type: VotingTableResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVotingTableDto: UpdateVotingTableDto,
  ) {
    return this.votingTableService.update(id, updateVotingTableDto);
  }

  @Delete(':id')
  @Permission('voting-tables:delete')
  @ApiOperation({ summary: 'Eliminar mesa de votación' })
  @ApiResponse({ status: 200, description: 'Mesa eliminada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.votingTableService.remove(id);
  }
}
