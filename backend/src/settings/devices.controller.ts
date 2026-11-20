import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  AnyPermissions,
  Permissions,
} from '../auth/decorators/permissions.decorator.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { SettingsService } from './settings.service.js';
import { CreateDeviceDto } from './dto/create-device.dto.js';
import { UpdateDeviceDto } from './dto/update-device.dto.js';

@Controller('devices')
export class DevicesController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @AnyPermissions(
    PERMISSIONS.storeSettingsRead,
    PERMISSIONS.storeSettingsUpdate,
  )
  listDevices() {
    return this.settingsService.listDevices();
  }

  @Get('me/counters')
  @AnyPermissions(
    PERMISSIONS.storeSettingsRead,
    PERMISSIONS.storeSettingsUpdate,
    PERMISSIONS.transactionsCreate,
    PERMISSIONS.shiftsOpen,
  )
  async getMyDeviceCounters(
    @Headers('x-device-id') deviceIdHeader?: string,
    @Headers('x-device-code') deviceCodeHeader?: string,
    @Query('deviceId') deviceIdQuery?: string,
    @Query('date') dateQuery?: string,
  ) {
    const deviceId = deviceIdHeader || deviceIdQuery;
    if (deviceId) {
      return this.settingsService.getDeviceCounters(deviceId, dateQuery);
    }
    if (deviceCodeHeader) {
      const devicesList = await this.settingsService.listDevices();
      const dev = devicesList.find((d) => d.code === deviceCodeHeader);
      if (dev) {
        return this.settingsService.getDeviceCounters(dev.id, dateQuery);
      }
    }
    const devicesList = await this.settingsService.listDevices();
    const active = devicesList.find((d) => d.isActive) || devicesList[0];
    if (active) {
      return this.settingsService.getDeviceCounters(active.id, dateQuery);
    }
    return {
      deviceId: null,
      deviceCode: 'POS1',
      businessDate: new Date().toISOString().slice(0, 10),
      lastNo: 0,
      queueEpoch: 0,
    };
  }

  @Get(':id')
  @AnyPermissions(
    PERMISSIONS.storeSettingsRead,
    PERMISSIONS.storeSettingsUpdate,
  )
  getDevice(@Param('id', ParseUUIDPipe) id: string) {
    return this.settingsService.getDevice(id);
  }

  @Get(':id/counters')
  @AnyPermissions(
    PERMISSIONS.storeSettingsRead,
    PERMISSIONS.storeSettingsUpdate,
  )
  getDeviceCounters(@Param('id', ParseUUIDPipe) id: string) {
    return this.settingsService.getDeviceCounters(id);
  }

  @Post()
  @Permissions(PERMISSIONS.storeSettingsUpdate)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  createDevice(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: CreateDeviceDto,
  ) {
    return this.settingsService.createDevice(currentUser, body);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.storeSettingsUpdate)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  updateDevice(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateDeviceDto,
  ) {
    return this.settingsService.updateDevice(currentUser, id, body);
  }
}
