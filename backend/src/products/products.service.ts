import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, inArray, sql } from 'drizzle-orm';
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
  inventories,
  productAddons,
  products,
  subcategories,
  transactionItems,
  transactions,
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

      if (input.subCategoryId) {
        const [subCategory] = await tx
          .select({
            id: subcategories.id,
            categoryId: subcategories.categoryId,
            isActive: subcategories.isActive,
          })
          .from(subcategories)
          .where(eq(subcategories.id, input.subCategoryId))
          .for('share');
        if (!subCategory || subCategory.categoryId !== input.categoryId) {
          throw new NotFoundException(
            'Subcategory not found for this category',
          );
        }
        if (!subCategory.isActive) {
          throw new BadRequestException('Subcategory is inactive');
        }
      }

      const [product] = await tx
        .insert(products)
        .values({
          name: input.name.trim(),
          price: normalizePrice(input.price),
          costPrice: input.costPrice ? normalizePrice(input.costPrice) : null,
          chargeTax: input.chargeTax ?? false,
          inStock: input.inStock ?? true,
          status: input.status ?? 'published',
          categoryId: input.categoryId,
          subCategoryId: input.subCategoryId ?? null,
          sku: input.sku?.trim() || null,
          barcode: input.barcode?.trim() || null,
          description: input.description?.trim() || null,
          images: input.images ?? [],
          variants: input.variants ?? [],
          isActive: input.status ? input.status === 'published' : true,
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

    const invSubquery = this.database.db
      .select({
        productId: inventories.productId,
        stock: sql<number>`coalesce(sum(${inventories.stock}), 0)::int`.as(
          'stock',
        ),
      })
      .from(inventories)
      .groupBy(inventories.productId)
      .as('inv');

    const salesSubquery = this.database.db
      .select({
        productId: transactionItems.productId,
        soldCount:
          sql<number>`coalesce(sum(${transactionItems.quantity}), 0)::int`.as(
            'sold_count',
          ),
      })
      .from(transactionItems)
      .innerJoin(
        transactions,
        eq(transactionItems.transactionId, transactions.id),
      )
      .where(eq(transactions.status, 'COMPLETED'))
      .groupBy(transactionItems.productId)
      .as('sales');

    const [items, [total]] = await Promise.all([
      this.database.db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          barcode: products.barcode,
          description: products.description,
          images: products.images,
          price: products.price,
          costPrice: products.costPrice,
          chargeTax: products.chargeTax,
          inStock: products.inStock,
          status: products.status,
          variants: products.variants,
          isActive: products.isActive,
          isAvailable: products.isAvailable,
          categoryId: products.categoryId,
          categoryName: categories.name,
          categoryIsActive: categories.isActive,
          subCategoryId: products.subCategoryId,
          subCategoryName: subcategories.name,
          stock: sql<number>`coalesce(${invSubquery.stock}, 0)::int`,
          soldCount: sql<number>`coalesce(${salesSubquery.soldCount}, 0)::int`,
        })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(subcategories, eq(products.subCategoryId, subcategories.id))
        .leftJoin(invSubquery, eq(products.id, invSubquery.productId))
        .leftJoin(salesSubquery, eq(products.id, salesSubquery.productId))
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
    const invSubquery = this.database.db
      .select({
        productId: inventories.productId,
        warehouseStock:
          sql<number>`coalesce(sum(case when ${inventories.location} = 'WAREHOUSE' then ${inventories.stock} else 0 end), 0)::int`.as(
            'warehouse_stock',
          ),
        displayStock:
          sql<number>`coalesce(sum(case when ${inventories.location} = 'DISPLAY' then ${inventories.stock} else 0 end), 0)::int`.as(
            'display_stock',
          ),
        totalStock: sql<number>`coalesce(sum(${inventories.stock}), 0)::int`.as(
          'total_stock',
        ),
        lastUpdated: sql<string>`max(${inventories.updatedAt})`.as(
          'last_updated',
        ),
      })
      .from(inventories)
      .where(eq(inventories.productId, id))
      .groupBy(inventories.productId)
      .as('inv');

    const salesSubquery = this.database.db
      .select({
        productId: transactionItems.productId,
        soldCount:
          sql<number>`coalesce(sum(${transactionItems.quantity}), 0)::int`.as(
            'sold_count',
          ),
      })
      .from(transactionItems)
      .innerJoin(
        transactions,
        eq(transactionItems.transactionId, transactions.id),
      )
      .where(
        and(
          eq(transactionItems.productId, id),
          eq(transactions.status, 'COMPLETED'),
        ),
      )
      .groupBy(transactionItems.productId)
      .as('sales');

    const [product] = await this.database.db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        barcode: products.barcode,
        description: products.description,
        images: products.images,
        price: products.price,
        costPrice: products.costPrice,
        chargeTax: products.chargeTax,
        inStock: products.inStock,
        status: products.status,
        variants: products.variants,
        isActive: products.isActive,
        isAvailable: products.isAvailable,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categoryIsActive: categories.isActive,
        subCategoryId: products.subCategoryId,
        subCategoryName: subcategories.name,
        warehouseStock: sql<number>`coalesce(${invSubquery.warehouseStock}, 0)::int`,
        displayStock: sql<number>`coalesce(${invSubquery.displayStock}, 0)::int`,
        stock: sql<number>`coalesce(${invSubquery.totalStock}, 0)::int`,
        soldCount: sql<number>`coalesce(${salesSubquery.soldCount}, 0)::int`,
        updatedAt: invSubquery.lastUpdated,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(subcategories, eq(products.subCategoryId, subcategories.id))
      .leftJoin(invSubquery, eq(products.id, invSubquery.productId))
      .leftJoin(salesSubquery, eq(products.id, salesSubquery.productId))
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
    const cashierDisplayStock =
      actor.role === 'CASHIER'
        ? await this.inventoryService.getDisplayStock([id])
        : undefined;
    return {
      ...product,
      displayStock: cashierDisplayStock?.get(id) ?? product.displayStock ?? 0,
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
      [
        input.name,
        input.categoryId,
        input.subCategoryId,
        input.sku,
        input.barcode,
        input.description,
        input.costPrice,
        input.chargeTax,
        input.inStock,
        input.status,
        input.images,
        input.variants,
      ].some((value) => value !== undefined) &&
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
    if (input.sku !== undefined) changes.sku = input.sku?.trim() || null;
    if (input.barcode !== undefined)
      changes.barcode = input.barcode?.trim() || null;
    if (input.description !== undefined)
      changes.description = input.description?.trim() || null;
    if (input.costPrice !== undefined)
      changes.costPrice = input.costPrice
        ? normalizePrice(input.costPrice)
        : null;
    if (input.chargeTax !== undefined) changes.chargeTax = input.chargeTax;
    if (input.inStock !== undefined) changes.inStock = input.inStock;
    if (input.status !== undefined) changes.status = input.status;
    if (input.images !== undefined) changes.images = input.images;
    if (input.variants !== undefined) changes.variants = input.variants;
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
      const effectiveCategoryId = input.categoryId ?? existing.categoryId;
      if (input.categoryId !== undefined || input.isActive === true) {
        const [category] = await tx
          .select({ id: categories.id, isActive: categories.isActive })
          .from(categories)
          .where(eq(categories.id, effectiveCategoryId))
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
      if (input.subCategoryId !== undefined) {
        if (input.subCategoryId) {
          const [subCategory] = await tx
            .select({
              id: subcategories.id,
              categoryId: subcategories.categoryId,
              isActive: subcategories.isActive,
            })
            .from(subcategories)
            .where(eq(subcategories.id, input.subCategoryId))
            .for('share');
          if (!subCategory || subCategory.categoryId !== effectiveCategoryId) {
            throw new NotFoundException(
              'Subcategory not found for this category',
            );
          }
          if (!subCategory.isActive) {
            throw new BadRequestException('Subcategory is inactive');
          }
          changes.subCategoryId = input.subCategoryId;
        } else {
          changes.subCategoryId = null;
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
