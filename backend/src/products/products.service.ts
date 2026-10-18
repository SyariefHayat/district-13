import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, inArray } from 'drizzle-orm';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import {
  PERMISSIONS,
  roleHasPermission,
} from '../auth/permissions/permissions.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import {
  addons,
  categories,
  productAddons,
  products,
} from '../drizzle/schema/index.js';
import type { CreateProductDto } from './dto/create-product.dto.js';
import type { ListProductsDto } from './dto/list-products.dto.js';
import type { SetProductAddonsDto } from './dto/set-product-addons.dto.js';
import type { UpdateProductDto } from './dto/update-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(input: CreateProductDto) {
    return this.database.db.transaction(async (tx) => {
      const [category] = await tx
        .select({ id: categories.id, isActive: categories.isActive })
        .from(categories)
        .where(eq(categories.id, input.categoryId))
        .for('share');
      if (!category) throw new NotFoundException('Category not found');
      if (!category.isActive)
        throw new BadRequestException('Category is inactive');
      const [product] = await tx
        .insert(products)
        .values({
          name: input.name.trim(),
          price: normalizePrice(input.price),
          categoryId: input.categoryId,
          isActive: true,
        })
        .returning();
      return product;
    });
  }

  async findAll(query: ListProductsDto, actor: AuthenticatedUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filters = [];
    if (actor.role === 'CASHIER') {
      filters.push(eq(products.isActive, true), eq(categories.isActive, true));
    } else if (query.isActive !== undefined) {
      filters.push(eq(products.isActive, query.isActive === 'true'));
    }
    if (query.categoryId)
      filters.push(eq(products.categoryId, query.categoryId));
    const where = filters.length ? and(...filters) : undefined;

    const [items, [total]] = await Promise.all([
      this.database.db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          isActive: products.isActive,
          isAvailable: products.isAvailable,
          categoryId: products.categoryId,
          categoryName: categories.name,
          categoryIsActive: categories.isActive,
        })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(where)
        .orderBy(products.name)
        .limit(limit)
        .offset((page - 1) * limit),
      this.database.db
        .select({ total: count() })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(where),
    ]);
    const data =
      actor.role === 'CASHIER' ? await this.withDisplayStock(items) : items;
    return { data, page, limit, total: Number(total.total) };
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const [product] = await this.database.db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        isActive: products.isActive,
        isAvailable: products.isAvailable,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categoryIsActive: categories.isActive,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1);
    if (!product) throw new NotFoundException('Product not found');
    if (
      actor.role === 'CASHIER' &&
      (!product.isActive || !product.categoryIsActive)
    ) {
      throw new NotFoundException('Product not found');
    }
    const activeAddonRows = await this.database.db
      .select({
        id: addons.id,
        name: addons.name,
        price: addons.price,
        isActive: addons.isActive,
      })
      .from(productAddons)
      .innerJoin(addons, eq(productAddons.addonId, addons.id))
      .where(
        actor.role === 'CASHIER'
          ? and(eq(productAddons.productId, id), eq(addons.isActive, true))
          : eq(productAddons.productId, id),
      );
    const displayStock =
      actor.role === 'CASHIER'
        ? await this.inventoryService.getDisplayStock([id])
        : undefined;
    return {
      ...product,
      ...(displayStock && { displayStock: displayStock.get(id) ?? 0 }),
      addons: activeAddonRows,
    };
  }

  async update(id: string, input: UpdateProductDto, actor: AuthenticatedUser) {
    if (
      input.price !== undefined &&
      !roleHasPermission(actor.role, PERMISSIONS.productsUpdatePrices)
    )
      throw new ForbiddenException('You cannot change product prices');
    if (
      [input.name, input.categoryId].some((value) => value !== undefined) &&
      !roleHasPermission(actor.role, PERMISSIONS.productsUpdateDetails)
    )
      throw new ForbiddenException('You cannot change product details');
    if (
      input.isActive !== undefined &&
      !roleHasPermission(actor.role, PERMISSIONS.productsDeactivate)
    )
      throw new ForbiddenException('You cannot change product active status');
    if (
      input.isAvailable !== undefined &&
      !roleHasPermission(actor.role, PERMISSIONS.productsUpdateAvailability)
    )
      throw new ForbiddenException('You cannot change product availability');
    const changes: Partial<typeof products.$inferInsert> = {};
    if (input.name !== undefined) changes.name = input.name.trim();
    if (input.price !== undefined) changes.price = normalizePrice(input.price);
    if (input.isActive !== undefined) changes.isActive = input.isActive;
    if (input.isAvailable !== undefined)
      changes.isAvailable = input.isAvailable;

    return this.database.db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: products.id, categoryId: products.categoryId })
        .from(products)
        .where(eq(products.id, id))
        .for('update')
        .limit(1);
      if (!existing) throw new NotFoundException('Product not found');
      if (input.categoryId !== undefined || input.isActive === true) {
        const categoryId = input.categoryId ?? existing.categoryId;
        const [category] = await tx
          .select({ id: categories.id, isActive: categories.isActive })
          .from(categories)
          .where(eq(categories.id, categoryId))
          .for('share');
        if (!category) throw new NotFoundException('Category not found');
        if (input.isActive === true && !category.isActive) {
          throw new BadRequestException(
            'Cannot activate a product in an inactive category',
          );
        }
        if (input.categoryId !== undefined) {
          if (!category.isActive)
            throw new BadRequestException('Category is inactive');
          changes.categoryId = input.categoryId;
        }
      }
      if (Object.keys(changes).length === 0)
        throw new BadRequestException('At least one field must be provided');
      const [updated] = await tx
        .update(products)
        .set(changes)
        .where(eq(products.id, id))
        .returning();
      return updated;
    });
  }

  async deactivate(id: string) {
    const [product] = await this.database.db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, id))
      .returning();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async setAddons(id: string, input: SetProductAddonsDto) {
    return this.database.db.transaction(async (tx) => {
      const [product] = await tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, id))
        .for('update');
      if (!product) throw new NotFoundException('Product not found');

      const ids = input.addonIds;
      if (ids.length) {
        const available = await tx
          .select({ id: addons.id })
          .from(addons)
          .where(and(inArray(addons.id, ids), eq(addons.isActive, true)))
          .orderBy(addons.id)
          .for('share');
        if (available.length !== ids.length) {
          throw new BadRequestException('All add-ons must exist and be active');
        }
      }

      await tx.delete(productAddons).where(eq(productAddons.productId, id));
      if (ids.length) {
        await tx
          .insert(productAddons)
          .values(ids.map((addonId) => ({ productId: id, addonId })));
      }
      return { productId: id, addonIds: ids };
    });
  }

  private async withDisplayStock<T extends { id: string }>(
    items: T[],
  ): Promise<(T & { displayStock: number })[]> {
    const stockByProduct = await this.inventoryService.getDisplayStock(
      items.map((item) => item.id),
    );
    return items.map((item) => ({
      ...item,
      displayStock: stockByProduct.get(item.id) ?? 0,
    }));
  }
}

function normalizePrice(price: string): string {
  const [whole, fractional = ''] = price.split('.');
  return `${whole}.${fractional.padEnd(2, '0')}`;
}
