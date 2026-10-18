import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
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
import { CreateProductDto } from './dto/create-product.dto.js';
import { ListProductsDto } from './dto/list-products.dto.js';
import { SetProductAddonsDto } from './dto/set-product-addons.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Permissions(PERMISSIONS.productsRead)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  findAll(
    @Query() query: ListProductsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.productsService.findAll(query, actor);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.productsRead)
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.productsService.findOne(id, actor);
  }

  @Post()
  @Permissions(PERMISSIONS.productsCreate)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  create(@Body() body: CreateProductDto) {
    return this.productsService.create(body);
  }

  @Patch(':id')
  @AnyPermissions(
    PERMISSIONS.productsUpdateDetails,
    PERMISSIONS.productsUpdatePrices,
    PERMISSIONS.productsUpdateAvailability,
    PERMISSIONS.productsDeactivate,
  )
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateProductDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.productsService.update(id, body, actor);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.productsDeactivate)
  deactivate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.deactivate(id);
  }

  @Put(':id/addons')
  @Permissions(PERMISSIONS.productsUpdateDetails)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  setAddons(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: SetProductAddonsDto,
  ) {
    return this.productsService.setAddons(id, body);
  }
}
