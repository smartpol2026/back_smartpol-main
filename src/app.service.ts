import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private startTime = new Date();

  getHealth(): any {
    const uptime = (Date.now() - this.startTime.getTime()) / 1000;
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: parseFloat(uptime.toFixed(3)),
      message: 'SmartPol API is running',
      endpoints: {
        docs: 'http://localhost:3000/api/docs',
        health: 'http://localhost:3000/health'
      }
    };
  }
}


