import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import { OverviewQueryDto } from './dto/overview-query.dto.js';
import { ReportQueryDto } from './dto/report-query.dto.js';
import { ReportsService } from './reports.service.js';

@Controller('reports')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('overview')
  @Permissions(PERMISSIONS.reportsDashboardSummaryRead)
  overview(@Query() q: OverviewQueryDto) {
    return this.reports.overview(q);
  }

  @Get('sales')
  @Permissions(PERMISSIONS.reportsSalesRead)
  sales(@Query() q: ReportQueryDto) {
    return this.reports.sales(q);
  }
  @Get('inventory')
  @Permissions(PERMISSIONS.reportsInventoryRead)
  inventory(@Query() q: ReportQueryDto) {
    return this.reports.inventory(q);
  }
  @Get('cash')
  @Permissions(PERMISSIONS.reportsCashRead)
  cash(@Query() q: ReportQueryDto) {
    return this.reports.cash(q);
  }
  @Get('shifts')
  @Permissions(PERMISSIONS.reportsShiftsRead)
  shifts(@Query() q: ReportQueryDto) {
    return this.reports.shifts(q);
  }
}
