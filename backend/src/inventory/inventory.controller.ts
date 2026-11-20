import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { ListInventoryDto } from './dto/list-inventory.dto.js';
import { ListMovementsDto } from './dto/list-movements.dto.js';
import { StockOperationDto } from './dto/stock-operation.dto.js';
import { StockRestockDto } from './dto/stock-restock.dto.js';
import { StockTransferDto } from './dto/stock-transfer.dto.js';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto.js';
import { ResolveReviewDto } from './dto/resolve-review.dto.js';
import { InventoryService } from './inventory.service.js';

@Controller('inventory')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('dashboard')
  @Permissions(PERMISSIONS.inventoryReadDashboard)
  getDashboard(@Query() query: ListInventoryDto) {
    return this.inventoryService.getDashboard(query);
  }

  @Get('movements')
  @Permissions(PERMISSIONS.inventoryReadMovements)
  getMovements(@Query() query: ListMovementsDto) {
    return this.inventoryService.getMovements(query);
  }

  @Get('low-stock')
  @Permissions(PERMISSIONS.inventoryReadDashboard)
  getLowStock(@Query() query: ListInventoryDto) {
    return this.inventoryService.getLowStock(query);
  }

  @Get('review-flags')
  @Permissions(PERMISSIONS.inventoryReadDashboard)
  getReviewFlags() {
    return this.inventoryService.getReviewFlags();
  }

  @Post('review-flags/:productId/resolve')
  @Permissions(PERMISSIONS.inventoryAdjust)
  resolveReview(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() body: ResolveReviewDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.inventoryService.resolveReviewFlag(productId, body, actor);
  }

  @Post(':productId/resolve-review')
  @Permissions(PERMISSIONS.inventoryAdjust)
  resolveReviewAlias(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() body: ResolveReviewDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.inventoryService.resolveReviewFlag(productId, body, actor);
  }

  @Post('restocks')
  @Permissions(PERMISSIONS.inventoryRestock)
  restocks(
    @Body() body: StockRestockDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.inventoryService.restock(body, actor);
  }

  @Post('restock')
  @Permissions(PERMISSIONS.inventoryRestock)
  restock(
    @Body() body: StockOperationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.inventoryService.restock(body, actor);
  }

  @Post('transfers')
  @Permissions(PERMISSIONS.inventoryTransferToDisplay)
  transfers(
    @Body() body: StockTransferDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.inventoryService.transferToDisplay(body, actor);
  }

  @Post('transfer-to-display')
  @Permissions(PERMISSIONS.inventoryTransferToDisplay)
  transferToDisplay(
    @Body() body: StockOperationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.inventoryService.transferToDisplay(body, actor);
  }

  @Post('adjustments')
  @Permissions(PERMISSIONS.inventoryAdjust)
  adjustments(
    @Body() body: StockAdjustmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.inventoryService.adjust(body, actor);
  }

  @Post('adjust')
  @Permissions(PERMISSIONS.inventoryAdjust)
  adjust(
    @Body() body: StockAdjustmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.inventoryService.adjust(body, actor);
  }
}
