import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { SettingsService } from './settings.service.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { ResetQueueCounterDto } from './dto/reset-queue-counter.dto.js';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Permissions(PERMISSIONS.storeSettingsRead)
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @Permissions(PERMISSIONS.storeSettingsUpdate)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  updateSettings(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(currentUser, body);
  }

  @Post('queue-counter/reset')
  @Permissions(PERMISSIONS.orderCounterReset)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  resetQueueCounter(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: ResetQueueCounterDto,
  ) {
    return this.settingsService.resetQueueCounter(currentUser, body);
  }
}
