import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AnyPermissions } from '../auth/decorators/permissions.decorator.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { SyncCatalogQueryDto } from './dto/sync-catalog-query.dto.js';
import { SyncEventsDto } from './dto/sync-events.dto.js';
import { SyncService } from './sync.service.js';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('catalog')
  @AnyPermissions(
    PERMISSIONS.transactionsCreate,
    PERMISSIONS.shiftsOpen,
    PERMISSIONS.productsRead,
  )
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  getCatalog(
    @Query() query: SyncCatalogQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.syncService.getCatalog(query, actor);
  }

  @Post(['events', 'sales'])
  @AnyPermissions(PERMISSIONS.transactionsCreate, PERMISSIONS.shiftsOpen)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  processEvents(
    @Body() dto: SyncEventsDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Headers('x-device-code') deviceCode?: string,
  ) {
    return this.syncService.processEvents(dto, actor, deviceCode);
  }
}
