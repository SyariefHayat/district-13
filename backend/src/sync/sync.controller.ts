import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
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
  private readonly activeDeviceSyncs = new Set<string>();

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
  async processEvents(
    @Body() dto: SyncEventsDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Headers('x-device-code') deviceCode?: string,
  ) {
    if (dto.events && dto.events.length > 50) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: 'RATE_LIMITED',
          error: 'Too Many Requests',
          message: 'Sync payload exceeds maximum limit of 50 events per batch',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const deviceKey = deviceCode?.trim() || actor?.id || 'default-device';
    if (this.activeDeviceSyncs.has(deviceKey)) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: 'RATE_LIMITED',
          error: 'Too Many Requests',
          message: 'A sync process is already running for this device',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.activeDeviceSyncs.add(deviceKey);
    try {
      return await this.syncService.processEvents(dto, actor, deviceCode);
    } finally {
      this.activeDeviceSyncs.delete(deviceKey);
    }
  }
}
