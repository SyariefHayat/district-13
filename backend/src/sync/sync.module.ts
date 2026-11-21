import { Module } from '@nestjs/common';
import { DatabaseModule } from '../drizzle/database/database.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { SyncController } from './sync.controller.js';
import { SyncService } from './sync.service.js';

@Module({
  imports: [DatabaseModule, InventoryModule],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
