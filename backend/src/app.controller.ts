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

  @Get('health/live')
  getLiveness(): Record<string, unknown> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/ready')
  async getReadiness(): Promise<Record<string, unknown>> {
    const startPing = Date.now();
    const [isDbConnected, isReportingDbConnected] = await Promise.all([
      this.databaseService.ping(),
      typeof this.databaseService.pingReporting === 'function'
        ? this.databaseService.pingReporting()
        : Promise.resolve(true),
    ]);
    const responseTimeMs = Date.now() - startPing;

    const memUsage = process.memoryUsage();
    const heapUsedMb = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMb = Math.round(memUsage.heapTotal / 1024 / 1024);
    const isMemoryHealthy = heapUsedMb < 1500; // Alert if heap > 1.5GB

    if (
      !isDbConnected ||
      !isReportingDbConnected ||
      !isMemoryHealthy ||
      responseTimeMs > 2000
    ) {
      throw new HttpException(
        {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Basis data atau pool laporan belum siap menerima koneksi',
          details: {
            database: isDbConnected ? 'connected' : 'disconnected',
            reportingDb: isReportingDbConnected ? 'connected' : 'disconnected',
            responseTimeMs,
            memory: isMemoryHealthy ? 'healthy' : 'high_usage',
            heapUsedMb,
            heapTotalMb,
          },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return {
      status: 'ok',
      database: 'connected',
      reportingDb: 'connected',
      checks: {
        database: 'connected',
        reportingDb: 'connected',
        memory: 'healthy',
      },
      responseTimeMs,
      timestamp: new Date().toISOString(),
    };
  }
}
