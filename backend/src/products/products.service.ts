import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { and, count, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import {
  PERMISSIONS,
  roleHasPermission,
} from '../auth/permissions/permissions.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import {
  addons,
  brands,
  categories,
  inventories,
  inventoryMovements,
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
import { parseCsv } from './utils/csv-parser.js';

@Injectable()
export class ProductsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly inventoryService: InventoryService,
    @Optional() private readonly auditLogs?: AuditLogsService,
  ) {}

  async create(input: CreateProductDto, actor?: AuthenticatedUser) {
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

      if (input.brandId) {
        const [brand] = await tx
          .select({ id: brands.id, isActive: brands.isActive })
          .from(brands)
          .where(eq(brands.id, input.brandId))
          .for('share');
        if (!brand) throw new NotFoundException('Brand not found');
        if (!brand.isActive) {
          throw new BadRequestException('Brand is inactive');
        }
      }

      // Check unique SKU
      if (input.sku?.trim()) {
        const sku = input.sku.trim();
        const [existing] = await tx
          .select({ id: products.id, name: products.name })
          .from(products)
          .where(eq(products.sku, sku))
          .limit(1);
        if (existing) {
          throw new ConflictException({
            statusCode: 409,
            error: 'Conflict',
            code: 'SKU_DUPLICATE',
            message: `SKU '${sku}' is already used by product '${existing.name}'`,
          });
        }
      }

      // Check unique Barcode
      if (input.barcode?.trim()) {
        const barcode = input.barcode.trim();
        const [existing] = await tx
          .select({ id: products.id, name: products.name })
          .from(products)
          .where(eq(products.barcode, barcode))
          .limit(1);
        if (existing) {
          throw new ConflictException({
            statusCode: 409,
            error: 'Conflict',
            code: 'BARCODE_DUPLICATE',
            message: `Barcode '${barcode}' is already used by product '${existing.name}'`,
          });
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
          brandId: input.brandId ?? null,
          sku: input.sku?.trim() || null,
          barcode: input.barcode?.trim() || null,
          description: input.description?.trim() || null,
          images: input.images ?? [],
          variants: input.variants ?? [],
          isActive: input.status ? input.status === 'published' : true,
          isAvailable: true,
        })
        .returning();

      // Automatically initialize stock rows in inventories
      await tx
        .insert(inventories)
        .values([
          { productId: product.id, location: 'WAREHOUSE', stock: 0 },
          { productId: product.id, location: 'DISPLAY', stock: 0 },
        ])
        .onConflictDoNothing();

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        await this.auditLogs.record({
          userId: actor?.id,
          action: 'PRODUCT_CREATED',
          entityType: 'PRODUCT',
          entityId: product.id,
          description: `Product ${product.name} created`,
          metadata: { after: product },
        });
      }

      return product;
    });
  }

  async findAll(query: ListProductsDto, actor: AuthenticatedUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filters = [];

    if (actor.role === 'CASHIER') {
      filters.push(
        eq(products.isActive, true),
        eq(products.isAvailable, true),
        eq(categories.isActive, true),
      );
    } else if (query.isActive !== undefined) {
      filters.push(eq(products.isActive, query.isActive === 'true'));
    }

    if (query.categoryId) {
      filters.push(eq(products.categoryId, query.categoryId));
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      filters.push(
        or(
          ilike(products.name, `%${term}%`),
          ilike(products.sku, `%${term}%`),
          ilike(products.barcode, `%${term}%`),
        ),
      );
    }

    // Exclude archived products by default
    filters.push(ne(products.status, 'archived'));

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
          brandId: products.brandId,
          brandName: brands.name,
          stock: sql<number>`coalesce(${invSubquery.stock}, 0)::int`,
          soldCount: sql<number>`coalesce(${salesSubquery.soldCount}, 0)::int`,
        })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(subcategories, eq(products.subCategoryId, subcategories.id))
        .leftJoin(brands, eq(products.brandId, brands.id))
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

    let data =
      actor.role === 'CASHIER' ? await this.withDisplayStock(items) : items;

    // Cashier must not see cost_price
    if (actor.role === 'CASHIER') {
      data = data.map((item) => {
        const { costPrice: _costPrice, ...rest } = item;
        return rest as typeof item;
      });
    }

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
        brandId: products.brandId,
        brandName: brands.name,
        warehouseStock: sql<number>`coalesce(${invSubquery.warehouseStock}, 0)::int`,
        displayStock: sql<number>`coalesce(${invSubquery.displayStock}, 0)::int`,
        stock: sql<number>`coalesce(${invSubquery.totalStock}, 0)::int`,
        soldCount: sql<number>`coalesce(${salesSubquery.soldCount}, 0)::int`,
        updatedAt: invSubquery.lastUpdated,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(subcategories, eq(products.subCategoryId, subcategories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(invSubquery, eq(products.id, invSubquery.productId))
      .leftJoin(salesSubquery, eq(products.id, salesSubquery.productId))
      .where(eq(products.id, id))
      .limit(1);

    if (!product) throw new NotFoundException('Product not found');
    if (
      actor.role === 'CASHIER' &&
      (!product.isActive || !product.isAvailable || !product.categoryIsActive)
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

    const result = {
      ...product,
      displayStock: cashierDisplayStock?.get(id) ?? product.displayStock ?? 0,
      addons: activeAddonRows,
    };

    if (actor.role === 'CASHIER') {
      const { costPrice: _costPrice, ...cashierResult } = result;
      return cashierResult;
    }

    return result;
  }

  async updatePrice(id: string, price: string, actor: AuthenticatedUser) {
    if (!roleHasPermission(actor.role, PERMISSIONS.productsUpdatePrices)) {
      throw new ForbiddenException('Only the owner can change product prices');
    }
    const [existing] = await this.database.db
      .select({ id: products.id, price: products.price, name: products.name })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Product not found');

    const newPrice = normalizePrice(price);
    const [updated] = await this.database.db
      .update(products)
      .set({ price: newPrice })
      .where(eq(products.id, id))
      .returning();

    if (this.auditLogs && typeof this.auditLogs.record === 'function') {
      await this.auditLogs.record({
        userId: actor.id,
        action: 'PRODUCT_PRICE_UPDATED',
        entityType: 'PRODUCT',
        entityId: id,
        description: `Product ${existing.name} price updated from ${existing.price} to ${updated.price}`,
        metadata: {
          before: { price: existing.price },
          after: { price: updated.price },
        },
      });
    }

    return updated;
  }

  async updateAvailability(
    id: string,
    isAvailable: boolean,
    actor: AuthenticatedUser,
  ) {
    if (
      !roleHasPermission(actor.role, PERMISSIONS.productsUpdateAvailability)
    ) {
      throw new ForbiddenException('You cannot change product availability');
    }
    const [existing] = await this.database.db
      .select({
        id: products.id,
        isAvailable: products.isAvailable,
        name: products.name,
      })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Product not found');

    const [updated] = await this.database.db
      .update(products)
      .set({ isAvailable })
      .where(eq(products.id, id))
      .returning();

    if (this.auditLogs && typeof this.auditLogs.record === 'function') {
      await this.auditLogs.record({
        userId: actor.id,
        action: 'PRODUCT_AVAILABILITY_CHANGED',
        entityType: 'PRODUCT',
        entityId: id,
        description: `Product ${existing.name} availability changed to ${isAvailable}`,
        metadata: {
          before: { isAvailable: existing.isAvailable },
          after: { isAvailable: updated.isAvailable },
        },
      });
    }

    return updated;
  }

  async activate(id: string, actor: AuthenticatedUser) {
    if (!roleHasPermission(actor.role, PERMISSIONS.productsDeactivate)) {
      throw new ForbiddenException('You cannot activate products');
    }
    return this.database.db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: products.id,
          name: products.name,
          categoryId: products.categoryId,
          isActive: products.isActive,
        })
        .from(products)
        .where(eq(products.id, id))
        .for('update')
        .limit(1);
      if (!existing) throw new NotFoundException('Product not found');

      const [category] = await tx
        .select({ id: categories.id, isActive: categories.isActive })
        .from(categories)
        .where(eq(categories.id, existing.categoryId))
        .for('share');
      if (!category) throw new NotFoundException('Category not found');
      if (!category.isActive) {
        throw new BadRequestException(
          'Cannot activate a product in an inactive category',
        );
      }

      const [updated] = await tx
        .update(products)
        .set({ isActive: true, isAvailable: true, status: 'published' })
        .where(eq(products.id, id))
        .returning();

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        await this.auditLogs.record({
          userId: actor.id,
          action: 'PRODUCT_UPDATED',
          entityType: 'PRODUCT',
          entityId: id,
          description: `Product ${existing.name} activated`,
          metadata: {
            before: { isActive: existing.isActive },
            after: { isActive: true, isAvailable: true },
          },
        });
      }

      return updated;
    });
  }

  async deactivate(id: string, actor?: AuthenticatedUser) {
    const [existing] = await this.database.db
      .select({
        id: products.id,
        name: products.name,
        isActive: products.isActive,
      })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Product not found');

    const [updated] = await this.database.db
      .update(products)
      .set({ isActive: false, isAvailable: false })
      .where(eq(products.id, id))
      .returning();

    if (this.auditLogs && typeof this.auditLogs.record === 'function') {
      await this.auditLogs.record({
        userId: actor?.id,
        action: 'PRODUCT_DEACTIVATED',
        entityType: 'PRODUCT',
        entityId: id,
        description: `Product ${existing.name} deactivated`,
        metadata: {
          before: { isActive: existing.isActive },
          after: { isActive: false, isAvailable: false },
        },
      });
    }

    return updated;
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
        input.brandId,
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
        .select()
        .from(products)
        .where(eq(products.id, id))
        .for('update')
        .limit(1);
      if (!existing) throw new NotFoundException('Product not found');

      // Check SKU duplicate
      if (input.sku !== undefined && input.sku?.trim()) {
        const sku = input.sku.trim();
        const [conflict] = await tx
          .select({ id: products.id, name: products.name })
          .from(products)
          .where(and(eq(products.sku, sku), ne(products.id, id)))
          .limit(1);
        if (conflict) {
          throw new ConflictException({
            statusCode: 409,
            error: 'Conflict',
            code: 'SKU_DUPLICATE',
            message: `SKU '${sku}' is already used by product '${conflict.name}'`,
          });
        }
      }

      // Check Barcode duplicate
      if (input.barcode !== undefined && input.barcode?.trim()) {
        const barcode = input.barcode.trim();
        const [conflict] = await tx
          .select({ id: products.id, name: products.name })
          .from(products)
          .where(and(eq(products.barcode, barcode), ne(products.id, id)))
          .limit(1);
        if (conflict) {
          throw new ConflictException({
            statusCode: 409,
            error: 'Conflict',
            code: 'BARCODE_DUPLICATE',
            message: `Barcode '${barcode}' is already used by product '${conflict.name}'`,
          });
        }
      }

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

      if (input.brandId !== undefined) {
        if (input.brandId) {
          const [brand] = await tx
            .select({ id: brands.id, isActive: brands.isActive })
            .from(brands)
            .where(eq(brands.id, input.brandId))
            .for('share');
          if (!brand) throw new NotFoundException('Brand not found');
          if (!brand.isActive) {
            throw new BadRequestException('Brand is inactive');
          }
          changes.brandId = input.brandId;
        } else {
          changes.brandId = null;
        }
      }

      if (Object.keys(changes).length === 0)
        throw new BadRequestException('At least one field must be provided');

      const [updated] = await tx
        .update(products)
        .set(changes)
        .where(eq(products.id, id))
        .returning();

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        if (changes.price !== undefined && changes.price !== existing.price) {
          await this.auditLogs.record({
            userId: actor.id,
            action: 'PRODUCT_PRICE_UPDATED',
            entityType: 'PRODUCT',
            entityId: id,
            description: `Product ${existing.name} price updated from ${existing.price} to ${updated.price}`,
            metadata: {
              before: { price: existing.price },
              after: { price: updated.price },
            },
          });
        } else {
          await this.auditLogs.record({
            userId: actor.id,
            action: 'PRODUCT_UPDATED',
            entityType: 'PRODUCT',
            entityId: id,
            description: `Product ${existing.name} updated`,
            metadata: {
              before: existing,
              after: updated,
            },
          });
        }
      }

      return updated;
    });
  }

  async remove(id: string, actor?: AuthenticatedUser) {
    return this.database.db.transaction(async (tx) => {
      const [product] = await tx
        .select({
          id: products.id,
          name: products.name,
          isActive: products.isActive,
        })
        .from(products)
        .where(eq(products.id, id))
        .for('update');
      if (!product) throw new NotFoundException('Product not found');

      // Check if product has historical sales transactions
      const [txItem] = await tx
        .select({ count: count() })
        .from(transactionItems)
        .where(eq(transactionItems.productId, id));

      if (txItem && Number(txItem.count) > 0) {
        // Archive product to preserve accounting integrity
        const [archived] = await tx
          .update(products)
          .set({ isActive: false, isAvailable: false, status: 'archived' })
          .where(eq(products.id, id))
          .returning();

        if (this.auditLogs && typeof this.auditLogs.record === 'function') {
          await this.auditLogs.record({
            userId: actor?.id,
            action: 'PRODUCT_DEACTIVATED',
            entityType: 'PRODUCT',
            entityId: id,
            description: `Product ${product.name} archived (has sales history)`,
            metadata: { after: { status: 'archived', isActive: false } },
          });
        }

        return archived;
      }

      // If no sales history, safely cascade delete related records and the product
      await tx.delete(productAddons).where(eq(productAddons.productId, id));
      await tx
        .delete(inventoryMovements)
        .where(eq(inventoryMovements.productId, id));
      await tx.delete(inventories).where(eq(inventories.productId, id));
      const [deleted] = await tx
        .delete(products)
        .where(eq(products.id, id))
        .returning();

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        await this.auditLogs.record({
          userId: actor?.id,
          action: 'PRODUCT_DEACTIVATED',
          entityType: 'PRODUCT',
          entityId: id,
          description: `Product ${product.name} deleted`,
          metadata: { before: product },
        });
      }

      return deleted;
    });
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

  async importProducts(csvText: string, actor: AuthenticatedUser) {
    if (!csvText || !csvText.trim()) {
      throw new BadRequestException('CSV file content is empty');
    }

    if (Buffer.byteLength(csvText, 'utf8') > 5 * 1024 * 1024) {
      throw new BadRequestException('CSV file exceeds 5MB size limit');
    }

    const { rows } = parseCsv(csvText, 5000);
    if (rows.length === 0) {
      throw new BadRequestException('No data rows found in CSV');
    }

    const allCategories = await this.database.db
      .select({
        id: categories.id,
        name: categories.name,
        isActive: categories.isActive,
      })
      .from(categories);
    const categoryMap = new Map<string, { id: string; isActive: boolean }>();
    for (const c of allCategories) {
      categoryMap.set(c.id.toLowerCase(), c);
      categoryMap.set(c.name.toLowerCase().trim(), c);
    }

    const allBrands = await this.database.db
      .select({ id: brands.id, name: brands.name, isActive: brands.isActive })
      .from(brands);
    const brandMap = new Map<string, { id: string; isActive: boolean }>();
    for (const b of allBrands) {
      brandMap.set(b.id.toLowerCase(), b);
      brandMap.set(b.name.toLowerCase().trim(), b);
    }

    const existingProducts = await this.database.db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        barcode: products.barcode,
      })
      .from(products);
    const skuMap = new Map<string, string>();
    const barcodeMap = new Map<string, string>();
    for (const p of existingProducts) {
      if (p.sku) skuMap.set(p.sku.toLowerCase().trim(), p.name);
      if (p.barcode) barcodeMap.set(p.barcode.toLowerCase().trim(), p.name);
    }

    const batchSkuSet = new Set<string>();
    const batchBarcodeSet = new Set<string>();

    const failedRows: Array<{
      row: number;
      data: Record<string, string>;
      error: string;
    }> = [];
    let successCount = 0;

    for (const { rowNumber, data } of rows) {
      const normalizedData: Record<string, string> = {};
      for (const [k, v] of Object.entries(data)) {
        normalizedData[k.toLowerCase().trim()] = (v ?? '').trim();
      }

      const name =
        normalizedData['name'] ||
        normalizedData['nama'] ||
        normalizedData['product_name'] ||
        normalizedData['product name'];
      const rawPrice =
        normalizedData['price'] ||
        normalizedData['harga'] ||
        normalizedData['harga_jual'] ||
        normalizedData['sale_price'];
      const rawCostPrice =
        normalizedData['cost_price'] ||
        normalizedData['costprice'] ||
        normalizedData['harga_beli'] ||
        normalizedData['modal'];
      const rawCategory =
        normalizedData['category'] ||
        normalizedData['category_id'] ||
        normalizedData['kategori'];
      const rawBrand =
        normalizedData['brand'] ||
        normalizedData['brand_id'] ||
        normalizedData['merek'];
      const sku = (
        normalizedData['sku'] ||
        normalizedData['kode_produk'] ||
        ''
      ).trim();
      const barcode = (normalizedData['barcode'] || '').trim();
      const description =
        normalizedData['description'] || normalizedData['deskripsi'] || null;

      if (!name) {
        failedRows.push({
          row: rowNumber,
          data,
          error: 'Product name is required',
        });
        continue;
      }

      if (!rawPrice || isNaN(Number(rawPrice)) || Number(rawPrice) < 0) {
        failedRows.push({
          row: rowNumber,
          data,
          error: `Invalid price: '${rawPrice}'`,
        });
        continue;
      }

      if (!rawCategory) {
        failedRows.push({
          row: rowNumber,
          data,
          error: 'Category is required',
        });
        continue;
      }

      const catEntry = categoryMap.get(rawCategory.toLowerCase().trim());
      if (!catEntry) {
        failedRows.push({
          row: rowNumber,
          data,
          error: `Category '${rawCategory}' not found`,
        });
        continue;
      }
      if (!catEntry.isActive) {
        failedRows.push({
          row: rowNumber,
          data,
          error: `Category '${rawCategory}' is inactive`,
        });
        continue;
      }

      let brandId: string | null = null;
      if (rawBrand) {
        const bEntry = brandMap.get(rawBrand.toLowerCase().trim());
        if (!bEntry) {
          failedRows.push({
            row: rowNumber,
            data,
            error: `Brand '${rawBrand}' not found`,
          });
          continue;
        }
        brandId = bEntry.id;
      }

      if (sku) {
        const lowerSku = sku.toLowerCase();
        if (skuMap.has(lowerSku)) {
          failedRows.push({
            row: rowNumber,
            data,
            error: `SKU '${sku}' is already used by product '${skuMap.get(lowerSku)}'`,
          });
          continue;
        }
        if (batchSkuSet.has(lowerSku)) {
          failedRows.push({
            row: rowNumber,
            data,
            error: `SKU '${sku}' is duplicated within import file`,
          });
          continue;
        }
      }

      if (barcode) {
        const lowerBarcode = barcode.toLowerCase();
        if (barcodeMap.has(lowerBarcode)) {
          failedRows.push({
            row: rowNumber,
            data,
            error: `Barcode '${barcode}' is already used by product '${barcodeMap.get(lowerBarcode)}'`,
          });
          continue;
        }
        if (batchBarcodeSet.has(lowerBarcode)) {
          failedRows.push({
            row: rowNumber,
            data,
            error: `Barcode '${barcode}' is duplicated within import file`,
          });
          continue;
        }
      }

      try {
        const normalizedPriceStr = normalizePrice(rawPrice);
        const normalizedCostStr =
          rawCostPrice &&
          !isNaN(Number(rawCostPrice)) &&
          Number(rawCostPrice) >= 0
            ? normalizePrice(rawCostPrice)
            : null;

        await this.database.db.transaction(async (tx) => {
          const [inserted] = await tx
            .insert(products)
            .values({
              name,
              price: normalizedPriceStr,
              costPrice: normalizedCostStr,
              categoryId: catEntry.id,
              brandId,
              sku: sku || null,
              barcode: barcode || null,
              description,
              isActive: true,
              isAvailable: true,
              status: 'published',
            })
            .returning();

          await tx
            .insert(inventories)
            .values([
              { productId: inserted.id, location: 'WAREHOUSE', stock: 0 },
              { productId: inserted.id, location: 'DISPLAY', stock: 0 },
            ])
            .onConflictDoNothing();
        });

        if (sku) {
          skuMap.set(sku.toLowerCase(), name);
          batchSkuSet.add(sku.toLowerCase());
        }
        if (barcode) {
          barcodeMap.set(barcode.toLowerCase(), name);
          batchBarcodeSet.add(barcode.toLowerCase());
        }

        successCount++;
      } catch (err) {
        failedRows.push({
          row: rowNumber,
          data,
          error: (err as Error).message || 'Failed to insert product',
        });
      }
    }

    return {
      totalRows: rows.length,
      successCount,
      failedCount: failedRows.length,
      failedRows,
    };
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
