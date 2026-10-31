import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import type { PostgresJsTransaction } from 'drizzle-orm/postgres-js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import {
  inventories,
  inventoryMovements,
  products,
  users,
} from '../drizzle/schema/index.js';
import type { ListInventoryDto } from './dto/list-inventory.dto.js';
import type { StockOperationDto } from './dto/stock-operation.dto.js';

@Injectable()
export class InventoryService {
  constructor(private readonly database: DatabaseService) {}

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
    return new Map(balances.map(({ productId, stock }) => [productId, stock]));
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
    }
    for (const sale of sorted) {
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
      if (!balance || balance.stock < sale.quantity) {
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
    }
    const movements: Array<typeof inventoryMovements.$inferInsert> = [];
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
      movements.push({
        productId: item.productId,
        toLocation: 'DISPLAY',
        type: 'VOID_RETURN',
        quantity: item.quantity,
        userId,
        transactionId,
      });
    }
    if (movements.length) await tx.insert(inventoryMovements).values(movements);
  }

  async getDashboard(query: ListInventoryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.productId
      ? eq(inventories.productId, query.productId)
      : undefined;
    const [items, [total], totals] = await Promise.all([
      this.database.db
        .select({
          id: inventories.id,
          productId: inventories.productId,
          productName: products.name,
          location: inventories.location,
          stock: inventories.stock,
          updatedAt: inventories.updatedAt,
        })
        .from(inventories)
        .innerJoin(products, eq(inventories.productId, products.id))
        .where(where)
        .orderBy(products.name, inventories.location)
        .limit(limit)
        .offset((page - 1) * limit),
      this.database.db
        .select({ total: count() })
        .from(inventories)
        .where(where),
      this.database.db
        .select({
          location: inventories.location,
          stock: sql<number>`coalesce(sum(${inventories.stock}), 0)::int`,
        })
        .from(inventories)
        .where(where)
        .groupBy(inventories.location),
    ]);

    const totalsByLocation = {
      WAREHOUSE: 0,
      DISPLAY: 0,
    };
    for (const item of totals) totalsByLocation[item.location] = item.stock;

    return {
      data: items,
      totals: totalsByLocation,
      page,
      limit,
      total: Number(total.total),
    };
  }

  async getMovements(query: ListInventoryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.productId
      ? eq(inventoryMovements.productId, query.productId)
      : undefined;
    const [data, [total]] = await Promise.all([
      this.database.db
        .select({
          id: inventoryMovements.id,
          productId: inventoryMovements.productId,
          productName: products.name,
          fromLocation: inventoryMovements.fromLocation,
          toLocation: inventoryMovements.toLocation,
          type: inventoryMovements.type,
          quantity: inventoryMovements.quantity,
          userId: inventoryMovements.userId,
          username: users.username,
          transactionId: inventoryMovements.transactionId,
          createdAt: inventoryMovements.createdAt,
        })
        .from(inventoryMovements)
        .innerJoin(products, eq(inventoryMovements.productId, products.id))
        .innerJoin(users, eq(inventoryMovements.userId, users.id))
        .where(where)
        .orderBy(desc(inventoryMovements.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.database.db
        .select({ total: count() })
        .from(inventoryMovements)
        .where(where),
    ]);
    return { data, page, limit, total: Number(total.total) };
  }

  async restock(input: StockOperationDto, actor: AuthenticatedUser) {
    const targetLocation = input.location ?? 'WAREHOUSE';
    return this.database.db.transaction(async (tx) => {
      await this.lockActiveProduct(tx, input.productId);
      const [inventory] = await tx
        .insert(inventories)
        .values({
          productId: input.productId,
          location: targetLocation,
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
      const [movement] = await tx
        .insert(inventoryMovements)
        .values({
          productId: input.productId,
          toLocation: targetLocation,
          type: 'STOCK_IN',
          quantity: input.quantity,
          userId: actor.id,
        })
        .returning();
      return { inventory, movement };
    });
  }

  async transferToDisplay(input: StockOperationDto, actor: AuthenticatedUser) {
    return this.database.db.transaction(async (tx) => {
      await this.lockActiveProduct(tx, input.productId);
      const [warehouse] = await tx
        .select()
        .from(inventories)
        .where(
          and(
            eq(inventories.productId, input.productId),
            eq(inventories.location, 'WAREHOUSE'),
          ),
        )
        .for('update');
      if (!warehouse || warehouse.stock < input.quantity) {
        throw new BadRequestException('Insufficient warehouse stock');
      }

      const [updatedWarehouse] = await tx
        .update(inventories)
        .set({ stock: warehouse.stock - input.quantity, updatedAt: new Date() })
        .where(eq(inventories.id, warehouse.id))
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
      const [movement] = await tx
        .insert(inventoryMovements)
        .values({
          productId: input.productId,
          fromLocation: 'WAREHOUSE',
          toLocation: 'DISPLAY',
          type: 'TRANSFER',
          quantity: input.quantity,
          userId: actor.id,
        })
        .returning();
      return { warehouse: updatedWarehouse, display, movement };
    });
  }

  private async lockActiveProduct(
    tx: PostgresJsTransaction<Record<string, never>>,
    productId: string,
  ) {
    const [product] = await tx
      .select({ id: products.id, isActive: products.isActive })
      .from(products)
      .where(eq(products.id, productId))
      .for('update');
    if (!product) throw new NotFoundException('Product not found');
    if (!product.isActive)
      throw new BadRequestException(
        'Cannot change stock for an inactive product',
      );
  }
}
