import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { CreateDiscountDto } from './dto/create-discount.dto.js';
import { UpdateDiscountDto } from './dto/update-discount.dto.js';
import { DiscountsService } from './discounts.service.js';

@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get()
  @Permissions(PERMISSIONS.discountsRead)
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.discountsService.findAll(actor);
  }

  @Get('code/:code')
  @Permissions(PERMISSIONS.discountsRead)
  findByCode(@Param('code') code: string) {
    return this.discountsService.findByCode(code);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.discountsRead)
  findOne(@Param('id') id: string) {
    return this.discountsService.findOne(id);
  }

  @Post()
  @Permissions(PERMISSIONS.discountsManage)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  create(
    @Body() body: CreateDiscountDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.discountsService.create(body, actor);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.discountsManage)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  update(
    @Param('id') id: string,
    @Body() body: UpdateDiscountDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.discountsService.update(id, body, actor);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.discountsManage)
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.discountsService.remove(id, actor);
  }
}
