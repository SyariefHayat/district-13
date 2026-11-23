import { Module } from '@nestjs/common';
import { DatabaseModule } from '../drizzle/database/database.module.js';
import { ReportsModule } from '../reports/reports.module.js';
import { MaintenanceService } from './maintenance.service.js';

@Module({
  imports: [DatabaseModule, ReportsModule],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
