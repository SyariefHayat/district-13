import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
