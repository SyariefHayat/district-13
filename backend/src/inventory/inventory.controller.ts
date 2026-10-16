import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { ListInventoryDto } from './dto/list-inventory.dto.js';
import { StockOperationDto } from './dto/stock-operation.dto.js';
import { InventoryService } from './inventory.service.js';

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
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
  getMovements(@Query() query: ListInventoryDto) {
    return this.inventoryService.getMovements(query);
  }

  @Post('restock')
  @Permissions(PERMISSIONS.inventoryRestock)
  restock(
    @Body() body: StockOperationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.inventoryService.restock(body, actor);
  }

  @Post('transfer-to-display')
  @Permissions(PERMISSIONS.inventoryTransferToDisplay)
  transferToDisplay(
    @Body() body: StockOperationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.inventoryService.transferToDisplay(body, actor);
  }
}
