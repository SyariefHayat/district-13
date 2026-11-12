import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  AnyPermissions,
  Permissions,
} from '../auth/decorators/permissions.decorator.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import { OverviewQueryDto } from './dto/overview-query.dto.js';
import { ReportQueryDto } from './dto/report-query.dto.js';
import { ProfitQueryDto } from './dto/profit-query.dto.js';
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

  @Get('profit')
  @AnyPermissions(PERMISSIONS.reportsProfitRead, PERMISSIONS.reportsSalesRead)
  profit(@Query() q: ProfitQueryDto) {
    return this.reports.profit(q);
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

  @Get('cashiers')
  @Permissions(PERMISSIONS.reportsCashierPerformanceRead)
  cashiers(@Query() q: ReportQueryDto) {
    return this.reports.cashierPerformance(q);
  }
}
