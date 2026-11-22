import {
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  AnyPermissions,
  Permissions,
} from '../auth/decorators/permissions.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import {
  PERMISSIONS,
  roleHasPermission,
} from '../auth/permissions/permissions.js';
import { OverviewQueryDto } from './dto/overview-query.dto.js';
import { ReportQueryDto } from './dto/report-query.dto.js';
import { ProfitQueryDto } from './dto/profit-query.dto.js';
import { ExportQueryDto } from './dto/export-query.dto.js';
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
  private readonly activeExports = new Set<string>();

  constructor(private readonly reports: ReportsService) {}

  @Get('dashboard')
  @Permissions(PERMISSIONS.reportsDashboardSummaryRead)
  dashboard(
    @Query() q: OverviewQueryDto,
    @CurrentUser() actor?: AuthenticatedUser,
  ) {
    return this.reports.dashboard(q, actor?.role);
  }

  @Get('overview')
  @Permissions(PERMISSIONS.reportsDashboardSummaryRead)
  overview(@Query() q: OverviewQueryDto) {
    return this.reports.overview(q);
  }

  @Get('profit')
  @Permissions(PERMISSIONS.reportsProfitRead)
  profit(@Query() q: ProfitQueryDto) {
    return this.reports.profit(q);
  }

  @Get('sales')
  @Permissions(PERMISSIONS.reportsSalesRead)
  sales(@Query() q: ReportQueryDto) {
    return this.reports.sales(q);
  }

  @Get('products')
  @Permissions(PERMISSIONS.reportsSalesRead)
  products(@Query() q: ReportQueryDto) {
    return this.reports.products(q);
  }

  @Get('inventory')
  @Permissions(PERMISSIONS.reportsInventoryRead)
  inventory(@Query() q: ReportQueryDto) {
    return this.reports.inventory(q);
  }

  @Get('cash')
  @AnyPermissions(
    PERMISSIONS.reportsCashRead,
    PERMISSIONS.reportsCashMovementsRead,
  )
  cash(@Query() q: ReportQueryDto) {
    return this.reports.cash(q);
  }

  @Get('cash-entries')
  @Permissions(PERMISSIONS.reportsCashMovementsRead)
  cashEntries(@Query() q: ReportQueryDto) {
    return this.reports.cashEntries(q);
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

  @Get('discounts')
  @Permissions(PERMISSIONS.reportsDiscountsRead)
  discounts(@Query() q: ReportQueryDto) {
    return this.reports.discounts(q);
  }

  @Get('payment-methods')
  @Permissions(PERMISSIONS.reportsPaymentMethodsRead)
  paymentMethods(@Query() q: ReportQueryDto) {
    return this.reports.paymentMethods(q);
  }

  @Get('reconciliation')
  @AnyPermissions(PERMISSIONS.reportsSalesRead, PERMISSIONS.reportsProfitRead)
  reconciliation(@Query() q: OverviewQueryDto) {
    return this.reports.reconciliation(q);
  }

  @Get('export')
  async exportQuery(
    @Query() q: ExportQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const type = q.type || 'sales';
    return this.export(type, q, actor, res);
  }

  @Get(':type/export')
  async export(
    @Param('type') type: string,
    @Query() q: ExportQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    this.verifyExportPermissions(type, actor);

    if (actor?.id && this.activeExports.has(actor.id)) {
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: 'Another export is already in progress for this user',
      });
    }

    if (actor?.id) {
      this.activeExports.add(actor.id);
    }

    try {
      await this.reports.export(res, type, q, actor);
    } finally {
      if (actor?.id) {
        this.activeExports.delete(actor.id);
      }
    }
  }

  private verifyExportPermissions(type: string, actor?: AuthenticatedUser) {
    if (!actor) return;

    if (
      type === 'profit' &&
      !roleHasPermission(actor.role, PERMISSIONS.reportsProfitRead)
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Owner permission required for profit reports',
      });
    }
    if (
      type === 'discounts' &&
      !roleHasPermission(actor.role, PERMISSIONS.reportsDiscountsRead)
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Owner permission required for discount reports',
      });
    }
    if (
      type === 'payment-methods' &&
      !roleHasPermission(actor.role, PERMISSIONS.reportsPaymentMethodsRead)
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Owner permission required for payment methods reports',
      });
    }
    if (
      ['sales', 'products'].includes(type) &&
      !roleHasPermission(actor.role, PERMISSIONS.reportsSalesRead)
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Insufficient permission for sales reports',
      });
    }
    if (
      type === 'inventory' &&
      !roleHasPermission(actor.role, PERMISSIONS.reportsInventoryRead)
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Insufficient permission for inventory reports',
      });
    }
    if (
      ['cash', 'cash-entries'].includes(type) &&
      !roleHasPermission(actor.role, PERMISSIONS.reportsCashRead) &&
      !roleHasPermission(actor.role, PERMISSIONS.reportsCashMovementsRead)
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Insufficient permission for cash reports',
      });
    }
    if (
      type === 'shifts' &&
      !roleHasPermission(actor.role, PERMISSIONS.reportsShiftsRead)
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Insufficient permission for shift reports',
      });
    }
    if (
      type === 'cashiers' &&
      !roleHasPermission(actor.role, PERMISSIONS.reportsCashierPerformanceRead)
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Insufficient permission for cashier performance reports',
      });
    }
    if (
      type === 'reconciliation' &&
      !roleHasPermission(actor.role, PERMISSIONS.reportsSalesRead) &&
      !roleHasPermission(actor.role, PERMISSIONS.reportsProfitRead)
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Insufficient permission for reconciliation reports',
      });
    }
  }
}
