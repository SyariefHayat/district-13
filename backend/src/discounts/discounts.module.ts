import { Module } from '@nestjs/common';
import { DatabaseModule } from '../drizzle/database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { DiscountsController } from './discounts.controller.js';
import { DiscountsService } from './discounts.service.js';

@Module({
  imports: [DatabaseModule, AuthModule, AuditLogsModule],
  controllers: [DiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
