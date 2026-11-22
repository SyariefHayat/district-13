import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { DailySummariesService } from './daily-summaries.service.js';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, DailySummariesService],
  exports: [DailySummariesService, ReportsService],
})
export class ReportsModule {}
