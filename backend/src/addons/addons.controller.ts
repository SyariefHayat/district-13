import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { CreateAddonDto } from './dto/create-addon.dto.js';
import { UpdateAddonDto } from './dto/update-addon.dto.js';
import { AddonsService } from './addons.service.js';

@Controller('addons')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AddonsController {
  constructor(private readonly addonsService: AddonsService) {}

  @Get()
  @Permissions(PERMISSIONS.addonsRead)
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.addonsService.findAll(actor);
  }

  @Post()
  @Permissions(PERMISSIONS.addonsManage)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  create(@Body() body: CreateAddonDto) {
    return this.addonsService.create(body);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.addonsManage)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateAddonDto,
  ) {
    return this.addonsService.update(id, body);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.addonsManage)
  deactivate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.addonsService.deactivate(id);
  }
}
