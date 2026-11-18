import { Module } from '@nestjs/common';
import { AuditLogsController } from './audit-logs.controller.js';
import { AuditLogsService, AuditService } from './audit-logs.service.js';

@Module({
  controllers: [AuditLogsController],
  providers: [
    AuditLogsService,
    {
      provide: 'AuditService',
      useExisting: AuditLogsService,
    },
  ],
  exports: [AuditLogsService, 'AuditService'],
})
export class AuditLogsModule {}
