import { Module } from '@nestjs/common';
import { DatabaseModule } from '../drizzle/database/database.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { BrandsService } from './brands.service.js';
import { BrandsController } from './brands.controller.js';

@Module({
  imports: [DatabaseModule, AuditLogsModule, AuthModule],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}
