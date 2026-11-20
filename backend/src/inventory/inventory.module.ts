import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';

@Module({
  imports: [AuthModule, AuditLogsModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
