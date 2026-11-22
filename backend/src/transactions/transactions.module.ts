import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsService } from './transactions.service.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { ReportsModule } from '../reports/reports.module.js';

@Module({
  imports: [AuthModule, InventoryModule, AuditLogsModule, ReportsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
