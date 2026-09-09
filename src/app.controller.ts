import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @Public()
  @ApiOperation({
    summary: 'Check API health status',
    description: 'Verify that the API is running and operational',
  })
  @ApiResponse({
    status: 200,
    description: 'API is working correctly',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-01-27T21:30:00.000Z',
        uptime: 123.456,
        message: 'SmartPol API is running',
      },
    },
  })
  getHealth(): any {
    return this.appService.getHealth();
  }
}
