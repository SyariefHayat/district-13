import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AnyPermissions } from '../auth/decorators/permissions.decorator.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import { AuditLogsQueryDto } from './audit-logs.dto.js';
import { AuditLogsService } from './audit-logs.service.js';
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly logs: AuditLogsService) {}
  @Get()
  @AnyPermissions(
    PERMISSIONS.auditLogsRead,
    PERMISSIONS.auditLogsReadOperational,
  )
  list(@Query() q: AuditLogsQueryDto, @Req() req: Request) {
    return this.logs.list(q, req.user?.role === 'ADMIN');
  }
}
