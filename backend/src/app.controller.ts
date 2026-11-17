import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Public } from './auth/decorators/public.decorator.js';
import { DatabaseService } from './drizzle/database/database.service.js';

@Controller()
@Public()
export class AppController {
  private readonly startTime = Date.now();

  constructor(
    private readonly appService: AppService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): Record<string, unknown> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - this.startTime) / 1000),
    };
  }

  @Get('health/ready')
  async getReadiness(): Promise<Record<string, unknown>> {
    const isDbConnected = await this.databaseService.ping();
    if (!isDbConnected) {
      throw new HttpException(
        {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Basis data belum siap menerima koneksi',
          details: { database: 'disconnected' },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
