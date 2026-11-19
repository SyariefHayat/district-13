import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import {
  AnyPermissions,
  Permissions,
} from '../auth/decorators/permissions.decorator.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { CreateAddonDto } from './dto/create-addon.dto.js';
import { UpdateAddonDto } from './dto/update-addon.dto.js';
import { UpdateAddonPriceDto } from './dto/update-addon-price.dto.js';
import { AddonsService } from './addons.service.js';

@Controller('addons')
export class AddonsController {
  constructor(private readonly addonsService: AddonsService) {}

  @Get()
  @Permissions(PERMISSIONS.addonsRead)
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.addonsService.findAll(actor);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.addonsRead)
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.addonsService.findOne(id, actor);
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
  create(
    @Body() body: CreateAddonDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.addonsService.create(body, actor);
  }

  @Patch(':id/price')
  @Permissions(PERMISSIONS.addonsUpdatePrices)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  updatePrice(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateAddonPriceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.addonsService.updatePrice(id, body.price, actor);
  }

  @Patch(':id')
  @AnyPermissions(PERMISSIONS.addonsManage, PERMISSIONS.addonsUpdatePrices)
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
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.addonsService.update(id, body, actor);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.addonsManage)
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.addonsService.remove(id, actor);
  }
}
