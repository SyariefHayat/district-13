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
import { BrandsService } from './brands.service.js';
import { CreateBrandDto } from './dto/create-brand.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @AnyPermissions(
    PERMISSIONS.categoriesRead,
    PERMISSIONS.productsRead,
    PERMISSIONS.brandsManage,
  )
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.brandsService.findAll(actor);
  }

  @Get(':id')
  @AnyPermissions(
    PERMISSIONS.categoriesRead,
    PERMISSIONS.productsRead,
    PERMISSIONS.brandsManage,
  )
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.brandsService.findOne(id, actor);
  }

  @Post()
  @Permissions(PERMISSIONS.brandsManage)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  create(
    @Body() body: CreateBrandDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.brandsService.create(body, actor);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.brandsManage)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateBrandDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.brandsService.update(id, body, actor);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.brandsManage)
  deactivate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.brandsService.deactivate(id, actor);
  }

  @Post(':id/activate')
  @Permissions(PERMISSIONS.brandsManage)
  activate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.brandsService.activate(id, actor);
  }
}
