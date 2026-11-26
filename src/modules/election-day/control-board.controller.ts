import { Controller, Get, Query, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permission } from '../../permissions/permission.decorator';
import { ElectionDayService } from './election-day.service';
import { MapPointsQueryDto } from './dto/map-points-query.dto';

@ApiTags('Control Board')
@ApiBearerAuth('access-token')
@Controller('control-board')
export class ControlBoardController {
  constructor(private readonly electionDayService: ElectionDayService) {}

  @Get('map-points')
  @Permission('control-board:read')
  @ApiOperation({
    summary:
      'Get georeferenced voting booths scoped by organization and DIVIPOLA',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        points: [
          {
            id: 1,
            name: 'I.E. San José',
            type: 'puesto',
            lat: 8.75,
            lng: -75.88,
            departmentCode: '23',
            municipalityCode: '23001',
            status: 'en_operacion',
            hasNovelties: true,
          },
        ],
        summary: [
          {
            code: '23',
            level: 'department',
            total: 120,
            withNovelties: 8,
          },
        ],
      },
    },
  })
  getMapPoints(@Request() req: any, @Query() query: MapPointsQueryDto) {
    return this.electionDayService.getMapPoints(req.user, query);
  }
}
