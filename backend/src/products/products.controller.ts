import {
  BadRequestException,
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
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { UpdatePriceDto } from './dto/update-price.dto.js';
import { UpdateAvailabilityDto } from './dto/update-availability.dto.js';
import { ImportProductsDto } from './dto/import-product.dto.js';
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
  create(
    @Body() body: CreateProductDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.productsService.create(body, actor);
  }

  @Post('import')
  @Permissions(PERMISSIONS.productsCreate)
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(
    @UploadedFile() file?: { buffer?: Buffer },
    @Body() body?: ImportProductsDto,
    @CurrentUser() actor?: AuthenticatedUser,
  ) {
    let csvContent = '';
    if (file?.buffer) {
      csvContent = file.buffer.toString('utf-8');
    } else if (body?.csv) {
      csvContent = body.csv;
    } else {
      throw new BadRequestException(
        'Please provide a CSV file upload or csv text in the body',
      );
    }
    return this.productsService.importProducts(csvContent, actor!);
  }

  @Patch(':id/price')
  @Permissions(PERMISSIONS.productsUpdatePrices)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  updatePrice(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdatePriceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.productsService.updatePrice(id, body.price, actor);
  }

  @Patch(':id/availability')
  @Permissions(PERMISSIONS.productsUpdateAvailability)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  updateAvailability(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateAvailabilityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.productsService.updateAvailability(id, body.isAvailable, actor);
  }

  @Post(':id/activate')
  @Permissions(PERMISSIONS.productsDeactivate)
  activate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.productsService.activate(id, actor);
  }

  @Post(':id/deactivate')
  @Permissions(PERMISSIONS.productsDeactivate)
  deactivate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.productsService.deactivate(id, actor);
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
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.productsService.remove(id, actor);
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
