import { Module } from '@nestjs/common';
import { DatabaseModule } from '../drizzle/database/database.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { SettingsService } from './settings.service.js';
import { SettingsController } from './settings.controller.js';
import { DevicesController } from './devices.controller.js';

@Module({
  imports: [DatabaseModule, AuditLogsModule, AuthModule],
  controllers: [SettingsController, DevicesController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
