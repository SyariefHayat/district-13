import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';

@Module({
  imports: [AuthModule, InventoryModule, AuditLogsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
