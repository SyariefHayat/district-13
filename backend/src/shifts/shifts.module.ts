import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ShiftsController } from './shifts.controller.js';
import { CashEntriesController } from './cash-entries.controller.js';
import { ShiftsService } from './shifts.service.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';

@Module({
  imports: [AuthModule, AuditLogsModule],
  controllers: [ShiftsController, CashEntriesController],
  providers: [ShiftsService],
  exports: [ShiftsService],
})
export class ShiftsModule {}
