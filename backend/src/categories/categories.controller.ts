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
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CategoriesService } from './categories.service.js';

@Controller('categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Permissions(PERMISSIONS.categoriesRead)
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.categoriesService.findAll(actor);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.categoriesRead)
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.categoriesService.findOne(id, actor);
  }

  @Post()
  @Permissions(PERMISSIONS.categoriesManage)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  create(@Body() body: CreateCategoryDto) {
    return this.categoriesService.create(body);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.categoriesManage)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, body);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.categoriesManage)
  deactivate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.categoriesService.deactivate(id);
  }
}
