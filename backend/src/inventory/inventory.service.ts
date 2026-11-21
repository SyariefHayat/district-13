import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import type { PostgresJsTransaction } from 'drizzle-orm/postgres-js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import {
  categories,
  inventories,
  inventoryMovements,
  products,
  stock,
  stockMovements,
  users,
} from '../drizzle/schema/index.js';
import type { ListInventoryDto } from './dto/list-inventory.dto.js';
import type { ListMovementsDto } from './dto/list-movements.dto.js';
import type { StockOperationDto } from './dto/stock-operation.dto.js';
import type { StockRestockDto } from './dto/stock-restock.dto.js';
import type { StockTransferDto } from './dto/stock-transfer.dto.js';
import type { StockAdjustmentDto } from './dto/stock-adjustment.dto.js';
import type { ResolveReviewDto } from './dto/resolve-review.dto.js';

@Injectable()
export class InventoryService {
  constructor(
    private readonly database: DatabaseService,
    @Optional() private readonly auditLogs?: AuditLogsService,
  ) {}

  async getDisplayStock(productIds: readonly string[]) {
    if (productIds.length === 0) return new Map<string, number>();

    const balances = await this.database.db
      .select({
        productId: inventories.productId,
        stock: inventories.stock,
      })
      .from(inventories)
      .where(
        and(
          inArray(inventories.productId, [...productIds]),
          eq(inventories.location, 'DISPLAY'),
        ),
      );
    return new Map(balances.map(({ productId, stock: s }) => [productId, s]));
  }

  async deductForSale(
    tx: PostgresJsTransaction<Record<string, never>>,
    sales: readonly { productId: string; quantity: number }[],
  ) {
    const sorted = [...sales].sort((a, b) =>
      a.productId.localeCompare(b.productId),
    );
    for (const sale of sorted) {
      await tx
        .insert(inventories)
        .values({ productId: sale.productId, location: 'DISPLAY', stock: 0 })
        .onConflictDoNothing();

      await tx
        .insert(stock)
        .values({
          productId: sale.productId,
          warehouseQty: 0,
          displayQty: 0,
          needsReview: false,
          version: 0,
        })
        .onConflictDoNothing();
    }
    for (const sale of sorted) {
      // Conditional update for CON-03
      const [updatedStock] = await tx
        .update(stock)
        .set({
          displayQty: sql`${stock.displayQty} - ${sale.quantity}`,
          version: sql`${stock.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(stock.productId, sale.productId),
            gte(stock.displayQty, sale.quantity),
          ),
        )
        .returning();

      const [balance] = await tx
        .select()
        .from(inventories)
        .where(
          and(
            eq(inventories.productId, sale.productId),
            eq(inventories.location, 'DISPLAY'),
          ),
        )
        .for('update');

      if (!balance || balance.stock < sale.quantity || !updatedStock) {
        throw new ConflictException(
          `Insufficient DISPLAY stock for product ${sale.productId}`,
        );
      }
      await tx
        .update(inventories)
        .set({ stock: balance.stock - sale.quantity, updatedAt: new Date() })
        .where(eq(inventories.id, balance.id));
    }
  }

  async deductForOfflineSale(
    tx: PostgresJsTransaction<Record<string, never>>,
    sales: readonly { productId: string; quantity: number }[],
  ) {
    const sorted = [...sales].sort((a, b) =>
      a.productId.localeCompare(b.productId),
    );
    for (const sale of sorted) {
      await tx
        .insert(inventories)
        .values({ productId: sale.productId, location: 'DISPLAY', stock: 0 })
        .onConflictDoNothing();

      await tx
        .insert(stock)
        .values({
          productId: sale.productId,
          warehouseQty: 0,
          displayQty: 0,
          needsReview: false,
          version: 0,
        })
        .onConflictDoNothing();
    }
    for (const sale of sorted) {
      // Unconditional deduction for OFF-008: if stock becomes negative, mark needsReview = true
      await tx
        .update(stock)
        .set({
          displayQty: sql`${stock.displayQty} - ${sale.quantity}`,
          needsReview: sql`CASE WHEN (${stock.displayQty} - ${sale.quantity}) < 0 THEN true ELSE ${stock.needsReview} END`,
          version: sql`${stock.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(stock.productId, sale.productId));

      const [balance] = await tx
        .select()
        .from(inventories)
        .where(
          and(
            eq(inventories.productId, sale.productId),
            eq(inventories.location, 'DISPLAY'),
          ),
        )
        .for('update');

      if (balance) {
        await tx
          .update(inventories)
          .set({ stock: balance.stock - sale.quantity, updatedAt: new Date() })
          .where(eq(inventories.id, balance.id));
      }
    }
  }

  async recordSaleMovements(
    tx: PostgresJsTransaction<Record<string, never>>,
    sales: readonly { productId: string; quantity: number }[],
    userId: string,
    transactionId: string,
  ) {
    if (!sales.length) return;
    await tx.insert(inventoryMovements).values(
      sales.map((sale) => ({
        productId: sale.productId,
        fromLocation: 'DISPLAY' as const,
        type: 'SALE' as const,
        quantity: sale.quantity,
        userId,
        transactionId,
      })),
    );

    await tx.insert(stockMovements).values(
      sales.map((sale) => ({
        productId: sale.productId,
        type: 'sale' as const,
        warehouseDelta: 0,
        displayDelta: -sale.quantity,
        refType: 'transaction',
        refId: transactionId,
        actorId: userId,
      })),
    );
  }

  async returnForVoid(
    tx: PostgresJsTransaction<Record<string, never>>,
    returned: readonly { productId: string; quantity: number }[],
    userId: string,
    transactionId: string,
  ) {
    const sorted = [...returned].sort((a, b) =>
      a.productId.localeCompare(b.productId),
    );
    for (const item of sorted) {
      await tx
        .insert(inventories)
        .values({ productId: item.productId, location: 'DISPLAY', stock: 0 })
        .onConflictDoNothing();

      await tx
        .insert(stock)
        .values({
          productId: item.productId,
          warehouseQty: 0,
          displayQty: 0,
          needsReview: false,
          version: 0,
        })
        .onConflictDoNothing();
    }
    const movements: Array<typeof inventoryMovements.$inferInsert> = [];
    const newMovements: Array<typeof stockMovements.$inferInsert> = [];

    for (const item of sorted) {
      const [balance] = await tx
        .select()
        .from(inventories)
        .where(
          and(
            eq(inventories.productId, item.productId),
            eq(inventories.location, 'DISPLAY'),
          ),
        )
        .for('update');
      if (!balance)
        throw new ConflictException('DISPLAY inventory is unavailable');

      await tx
        .update(inventories)
        .set({ stock: balance.stock + item.quantity, updatedAt: new Date() })
        .where(eq(inventories.id, balance.id));

      const [updatedStock] = await tx
        .update(stock)
        .set({
          displayQty: sql`${stock.displayQty} + ${item.quantity}`,
          version: sql`${stock.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(stock.productId, item.productId))
        .returning();

      if (
        updatedStock &&
        updatedStock.displayQty >= 0 &&
        updatedStock.needsReview
      ) {
        await tx
          .update(stock)
          .set({ needsReview: false })
          .where(eq(stock.productId, item.productId));
      }

      movements.push({
        productId: item.productId,
        toLocation: 'DISPLAY',
        type: 'VOID_RETURN',
        quantity: item.quantity,
        userId,
        transactionId,
      });

      newMovements.push({
        productId: item.productId,
        type: 'void',
        warehouseDelta: 0,
        displayDelta: item.quantity,
        refType: 'transaction',
        refId: transactionId,
        actorId: userId,
      });
    }
    if (movements.length) await tx.insert(inventoryMovements).values(movements);
    if (newMovements.length)
      await tx.insert(stockMovements).values(newMovements);
  }

  async getDashboard(query: ListInventoryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filters = [];

    if (query.productId) {
      filters.push(eq(products.id, query.productId));
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
    if (query.lowStockOnly === 'true') {
      filters.push(
        sql`(coalesce(${stock.warehouseQty}, 0) + coalesce(${stock.displayQty}, 0)) <= ${products.minStock}`,
      );
    }
    if (query.needsReviewOnly === 'true') {
      filters.push(
        or(eq(stock.needsReview, true), sql`${stock.displayQty} < 0`),
      );
    }

    const where = filters.length ? and(...filters) : undefined;

    const [items, [total], [summary]] = await Promise.all([
      this.database.db
        .select({
          productId: products.id,
          productName: products.name,
          sku: products.sku,
          barcode: products.barcode,
          unit: products.unit,
          categoryId: products.categoryId,
          categoryName: categories.name,
          warehouseQty: sql<number>`coalesce(${stock.warehouseQty}, 0)::int`,
          displayQty: sql<number>`coalesce(${stock.displayQty}, 0)::int`,
          totalStock: sql<number>`(coalesce(${stock.warehouseQty}, 0) + coalesce(${stock.displayQty}, 0))::int`,
          minStock: products.minStock,
          isLowStock: sql<boolean>`(coalesce(${stock.warehouseQty}, 0) + coalesce(${stock.displayQty}, 0)) <= ${products.minStock}`,
          needsReview: sql<boolean>`coalesce(${stock.needsReview}, false)`,
          updatedAt: stock.updatedAt,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(stock, eq(products.id, stock.productId))
        .where(where)
        .orderBy(products.name)
        .limit(limit)
        .offset((page - 1) * limit),

      this.database.db
        .select({ total: count() })
        .from(products)
        .leftJoin(stock, eq(products.id, stock.productId))
        .where(where),

      this.database.db
        .select({
          totalWarehouseQty: sql<number>`coalesce(sum(${stock.warehouseQty}), 0)::int`,
          totalDisplayQty: sql<number>`coalesce(sum(${stock.displayQty}), 0)::int`,
          totalStock: sql<number>`coalesce(sum(${stock.warehouseQty} + ${stock.displayQty}), 0)::int`,
          lowStockCount: sql<number>`coalesce(sum(case when (coalesce(${stock.warehouseQty}, 0) + coalesce(${stock.displayQty}, 0)) <= ${products.minStock} then 1 else 0 end), 0)::int`,
          needsReviewCount: sql<number>`coalesce(sum(case when ${stock.needsReview} = true or ${stock.displayQty} < 0 then 1 else 0 end), 0)::int`,
        })
        .from(products)
        .leftJoin(stock, eq(products.id, stock.productId)),
    ]);

    const totalsByLocation = {
      WAREHOUSE: summary?.totalWarehouseQty ?? 0,
      DISPLAY: summary?.totalDisplayQty ?? 0,
    };

    return {
      data: items,
      totals: totalsByLocation,
      summary: summary ?? {
        totalWarehouseQty: 0,
        totalDisplayQty: 0,
        totalStock: 0,
        lowStockCount: 0,
        needsReviewCount: 0,
      },
      page,
      limit,
      total: Number(total.total),
    };
  }

  async getMovements(query: ListMovementsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filters = [];

    if (query.productId) {
      filters.push(eq(stockMovements.productId, query.productId));
    }
    if (query.type) {
      filters.push(eq(stockMovements.type, query.type));
    }
    if (query.startDate) {
      filters.push(gte(stockMovements.occurredAt, new Date(query.startDate)));
    }
    if (query.endDate) {
      filters.push(lte(stockMovements.occurredAt, new Date(query.endDate)));
    }
    if (query.search?.trim()) {
      const term = query.search.trim();
      filters.push(
        or(ilike(products.name, `%${term}%`), ilike(products.sku, `%${term}%`)),
      );
    }

    const where = filters.length ? and(...filters) : undefined;

    const [data, [total]] = await Promise.all([
      this.database.db
        .select({
          id: stockMovements.id,
          productId: stockMovements.productId,
          productName: products.name,
          sku: products.sku,
          type: stockMovements.type,
          warehouseDelta: stockMovements.warehouseDelta,
          displayDelta: stockMovements.displayDelta,
          reason: stockMovements.reason,
          refType: stockMovements.refType,
          refId: stockMovements.refId,
          actorId: stockMovements.actorId,
          actorUsername: users.username,
          occurredAt: stockMovements.occurredAt,
        })
        .from(stockMovements)
        .innerJoin(products, eq(stockMovements.productId, products.id))
        .innerJoin(users, eq(stockMovements.actorId, users.id))
        .where(where)
        .orderBy(desc(stockMovements.occurredAt))
        .limit(limit)
        .offset((page - 1) * limit),

      this.database.db
        .select({ total: count() })
        .from(stockMovements)
        .innerJoin(products, eq(stockMovements.productId, products.id))
        .where(where),
    ]);

    return { data, page, limit, total: Number(total.total) };
  }

  async getLowStock(query: ListInventoryDto) {
    return this.getDashboard({
      ...query,
      lowStockOnly: 'true',
    });
  }

  async getReviewFlags() {
    return this.database.db
      .select({
        productId: products.id,
        productName: products.name,
        sku: products.sku,
        categoryName: categories.name,
        warehouseQty: sql<number>`coalesce(${stock.warehouseQty}, 0)::int`,
        displayQty: sql<number>`coalesce(${stock.displayQty}, 0)::int`,
        deficit: sql<number>`case when coalesce(${stock.displayQty}, 0) < 0 then abs(${stock.displayQty}) else 0 end::int`,
        needsReview: stock.needsReview,
        updatedAt: stock.updatedAt,
      })
      .from(products)
      .innerJoin(stock, eq(products.id, stock.productId))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(or(eq(stock.needsReview, true), sql`${stock.displayQty} < 0`))
      .orderBy(stock.displayQty);
  }

  async resolveReviewFlag(
    productId: string,
    input: ResolveReviewDto,
    actor: AuthenticatedUser,
  ) {
    return this.database.db.transaction(async (tx) => {
      const product = await this.lockActiveProduct(tx, productId);

      const [currentStock] = await tx
        .select()
        .from(stock)
        .where(eq(stock.productId, productId))
        .for('update');

      if (!currentStock) {
        throw new NotFoundException('Stock record not found');
      }

      let updatedDisplayQty = currentStock.displayQty;
      let displayDelta = 0;

      if (
        input.targetDisplayStock !== undefined &&
        input.targetDisplayStock >= 0
      ) {
        displayDelta = input.targetDisplayStock - currentStock.displayQty;
        updatedDisplayQty = input.targetDisplayStock;

        await tx.insert(stockMovements).values({
          productId,
          type: 'adjustment',
          warehouseDelta: 0,
          displayDelta,
          reason: input.notes
            ? `Review resolved: ${input.notes}`
            : 'Review resolved with display adjustment',
          actorId: actor.id,
        });

        await tx
          .insert(inventories)
          .values({
            productId,
            location: 'DISPLAY',
            stock: input.targetDisplayStock,
          })
          .onConflictDoUpdate({
            target: [inventories.productId, inventories.location],
            set: { stock: input.targetDisplayStock, updatedAt: new Date() },
          });
      }

      const [resolvedStock] = await tx
        .update(stock)
        .set({
          displayQty: updatedDisplayQty,
          needsReview: false,
          version: sql`${stock.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(stock.productId, productId))
        .returning();

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        await this.auditLogs.record({
          userId: actor.id,
          action: 'INVENTORY_REVIEW_RESOLVED',
          entityType: 'INVENTORY',
          entityId: productId,
          description: `Review flag resolved for product ${product.name}`,
          metadata: {
            productId,
            beforeDisplayQty: currentStock.displayQty,
            afterDisplayQty: resolvedStock.displayQty,
            notes: input.notes,
          },
        });
      }

      return resolvedStock;
    });
  }

  async restock(
    input: StockRestockDto | StockOperationDto,
    actor: AuthenticatedUser,
  ) {
    if (input.quantity <= 0) {
      throw new BadRequestException(
        'Restock quantity must be greater than zero',
      );
    }
    const notes = 'notes' in input ? input.notes : undefined;

    return this.database.db.transaction(async (tx) => {
      const product = await this.lockActiveProduct(tx, input.productId);

      await tx
        .insert(stock)
        .values({
          productId: input.productId,
          warehouseQty: 0,
          displayQty: 0,
          needsReview: false,
          version: 0,
        })
        .onConflictDoNothing();

      const [updatedStock] = await tx
        .update(stock)
        .set({
          warehouseQty: sql`${stock.warehouseQty} + ${input.quantity}`,
          version: sql`${stock.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(stock.productId, input.productId))
        .returning();

      const [movement] = await tx
        .insert(stockMovements)
        .values({
          productId: input.productId,
          type: 'restock',
          warehouseDelta: input.quantity,
          displayDelta: 0,
          reason: notes ?? null,
          actorId: actor.id,
        })
        .returning();

      const [inventory] = await tx
        .insert(inventories)
        .values({
          productId: input.productId,
          location: 'WAREHOUSE',
          stock: input.quantity,
        })
        .onConflictDoUpdate({
          target: [inventories.productId, inventories.location],
          set: {
            stock: sql`${inventories.stock} + ${input.quantity}`,
            updatedAt: new Date(),
          },
        })
        .returning();

      await tx.insert(inventoryMovements).values({
        productId: input.productId,
        toLocation: 'WAREHOUSE',
        type: 'STOCK_IN',
        quantity: input.quantity,
        userId: actor.id,
      });

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        await this.auditLogs.record({
          userId: actor.id,
          action: 'INVENTORY_STOCK_IN',
          entityType: 'INVENTORY',
          entityId: input.productId,
          description: `Restocked ${input.quantity} units for product ${product.name} to warehouse`,
          metadata: {
            productId: input.productId,
            quantity: input.quantity,
            warehouseQty: updatedStock.warehouseQty,
            notes,
          },
        });
      }

      return { stock: updatedStock, inventory, movement };
    });
  }

  async transferToDisplay(
    input: StockTransferDto | StockOperationDto,
    actor: AuthenticatedUser,
  ) {
    if (input.quantity <= 0) {
      throw new BadRequestException(
        'Transfer quantity must be greater than zero',
      );
    }

    return this.database.db.transaction(async (tx) => {
      const product = await this.lockActiveProduct(tx, input.productId);

      await tx
        .insert(stock)
        .values({
          productId: input.productId,
          warehouseQty: 0,
          displayQty: 0,
          needsReview: false,
          version: 0,
        })
        .onConflictDoNothing();

      const [updatedStock] = await tx
        .update(stock)
        .set({
          warehouseQty: sql`${stock.warehouseQty} - ${input.quantity}`,
          displayQty: sql`${stock.displayQty} + ${input.quantity}`,
          version: sql`${stock.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(stock.productId, input.productId),
            gte(stock.warehouseQty, input.quantity),
          ),
        )
        .returning();

      if (!updatedStock) {
        throw new BadRequestException('Insufficient warehouse stock');
      }

      if (updatedStock.displayQty >= 0 && updatedStock.needsReview) {
        await tx
          .update(stock)
          .set({ needsReview: false })
          .where(eq(stock.productId, input.productId));
        updatedStock.needsReview = false;
      }

      const [movement] = await tx
        .insert(stockMovements)
        .values({
          productId: input.productId,
          type: 'transfer',
          warehouseDelta: -input.quantity,
          displayDelta: input.quantity,
          actorId: actor.id,
        })
        .returning();

      const [updatedWarehouse] = await tx
        .update(inventories)
        .set({
          stock: sql`${inventories.stock} - ${input.quantity}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventories.productId, input.productId),
            eq(inventories.location, 'WAREHOUSE'),
          ),
        )
        .returning();

      const [display] = await tx
        .insert(inventories)
        .values({
          productId: input.productId,
          location: 'DISPLAY',
          stock: input.quantity,
        })
        .onConflictDoUpdate({
          target: [inventories.productId, inventories.location],
          set: {
            stock: sql`${inventories.stock} + ${input.quantity}`,
            updatedAt: new Date(),
          },
        })
        .returning();

      await tx.insert(inventoryMovements).values({
        productId: input.productId,
        fromLocation: 'WAREHOUSE',
        toLocation: 'DISPLAY',
        type: 'TRANSFER',
        quantity: input.quantity,
        userId: actor.id,
      });

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        await this.auditLogs.record({
          userId: actor.id,
          action: 'INVENTORY_TRANSFERRED',
          entityType: 'INVENTORY',
          entityId: input.productId,
          description: `Transferred ${input.quantity} units of ${product.name} from warehouse to display`,
          metadata: {
            productId: input.productId,
            quantity: input.quantity,
            warehouseQty: updatedStock.warehouseQty,
            displayQty: updatedStock.displayQty,
          },
        });
      }

      return {
        stock: updatedStock,
        warehouse: updatedWarehouse,
        display,
        movement,
      };
    });
  }

  async adjust(input: StockAdjustmentDto, actor: AuthenticatedUser) {
    if (!input.reason || input.reason.trim().length === 0) {
      throw new BadRequestException('Adjustment reason is required');
    }

    return this.database.db.transaction(async (tx) => {
      const product = await this.lockActiveProduct(tx, input.productId);

      await tx
        .insert(stock)
        .values({
          productId: input.productId,
          warehouseQty: 0,
          displayQty: 0,
          needsReview: false,
          version: 0,
        })
        .onConflictDoNothing();

      const [currentStock] = await tx
        .select()
        .from(stock)
        .where(eq(stock.productId, input.productId))
        .for('update');

      if (!currentStock) {
        throw new NotFoundException('Stock record not found');
      }

      const isWarehouse = input.location === 'WAREHOUSE';
      let warehouseDelta = 0;
      let displayDelta = 0;
      let newWarehouseQty = currentStock.warehouseQty;
      let newDisplayQty = currentStock.displayQty;
      let needsReview = currentStock.needsReview;

      if (isWarehouse) {
        if (input.actualStock < 0) {
          throw new BadRequestException('Warehouse stock cannot be negative');
        }
        warehouseDelta = input.actualStock - currentStock.warehouseQty;
        newWarehouseQty = input.actualStock;
      } else {
        displayDelta = input.actualStock - currentStock.displayQty;
        newDisplayQty = input.actualStock;
        if (newDisplayQty >= 0) {
          needsReview = false;
        } else {
          needsReview = true;
        }
      }

      const [updatedStock] = await tx
        .update(stock)
        .set({
          warehouseQty: newWarehouseQty,
          displayQty: newDisplayQty,
          needsReview,
          version: sql`${stock.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(stock.productId, input.productId))
        .returning();

      const [movement] = await tx
        .insert(stockMovements)
        .values({
          productId: input.productId,
          type: 'adjustment',
          warehouseDelta,
          displayDelta,
          reason: input.reason.trim(),
          actorId: actor.id,
        })
        .returning();

      await tx
        .insert(inventories)
        .values({
          productId: input.productId,
          location: input.location,
          stock: input.actualStock,
        })
        .onConflictDoUpdate({
          target: [inventories.productId, inventories.location],
          set: {
            stock: input.actualStock,
            updatedAt: new Date(),
          },
        });

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        await this.auditLogs.record({
          userId: actor.id,
          action: 'INVENTORY_ADJUSTED',
          entityType: 'INVENTORY',
          entityId: input.productId,
          description: `Adjusted ${input.location} stock for ${product.name} to ${input.actualStock}. Reason: ${input.reason}`,
          metadata: {
            productId: input.productId,
            location: input.location,
            beforeStock: isWarehouse
              ? currentStock.warehouseQty
              : currentStock.displayQty,
            afterStock: input.actualStock,
            reason: input.reason.trim(),
          },
        });
      }

      return { stock: updatedStock, movement };
    });
  }

  private async lockActiveProduct(
    tx: PostgresJsTransaction<Record<string, never>>,
    productId: string,
  ) {
    const [product] = await tx
      .select({
        id: products.id,
        name: products.name,
        isActive: products.isActive,
      })
      .from(products)
      .where(eq(products.id, productId))
      .for('update');
    if (!product) throw new NotFoundException('Product not found');
    if (!product.isActive)
      throw new BadRequestException(
        'Cannot change stock for an inactive product',
      );
    return product;
  }
}
