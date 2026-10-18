import { BadRequestException, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { DatabaseService } from '../drizzle/database/database.service.js';
import {
  cashMovements,
  categories,
  inventories,
  inventoryMovements,
  products,
  shifts,
  transactionItems,
  transactions,
  users,
} from '../drizzle/schema/index.js';
import type { ReportQueryDto } from './dto/report-query.dto.js';

@Injectable()
export class ReportsService {
  constructor(private readonly database: DatabaseService) {}
  private dateFilter(q: ReportQueryDto, column: any) {
    if (
      q.startDate &&
      q.endDate &&
      Date.parse(q.startDate) > Date.parse(q.endDate)
    )
      throw new BadRequestException('endDate must not precede startDate');
    const f = [];
    if (q.startDate) f.push(gte(column, new Date(q.startDate)));
    if (q.endDate) {
      const end = new Date(q.endDate);
      if (/^\d{4}-\d{2}-\d{2}$/.test(q.endDate))
        end.setUTCDate(end.getUTCDate() + 1);
      f.push(lt(column, end));
    }
    return f;
  }
  private async page<T>(
    query: Promise<T[]>,
    totalQuery: Promise<{ total: number }[]>,
    q: ReportQueryDto,
  ) {
    const [data, [n]] = await Promise.all([query, totalQuery]);
    return { data, page: q.page, limit: q.limit, total: Number(n?.total ?? 0) };
  }
  async sales(q: ReportQueryDto) {
    const filters = [
      ...this.dateFilter(q, transactions.createdAt),
      eq(transactions.status, 'COMPLETED'),
    ];
    if (q.userId) filters.push(eq(transactions.userId, q.userId));
    if (q.paymentMethod)
      filters.push(eq(transactions.paymentMethod, q.paymentMethod));
    const where = and(...filters);
    const [totals] = await this.database.db
      .select({
        gross: sql<string>`coalesce(sum(${transactions.subtotalAmount}),0)`,
        discount: sql<string>`coalesce(sum(${transactions.discountAmount}),0)`,
        net: sql<string>`coalesce(sum(${transactions.totalAmount}),0)`,
        count: count(),
      })
      .from(transactions)
      .where(where);
    const rows = this.database.db
      .select()
      .from(transactions)
      .where(where)
      .orderBy(desc(transactions.createdAt))
      .limit(q.limit)
      .offset((q.page - 1) * q.limit);
    const total = this.database.db
      .select({ total: count() })
      .from(transactions)
      .where(where);
    const [data, [n]] = await Promise.all([rows, total]);
    return {
      grossSales: totals.gross,
      discountTotal: totals.discount,
      netSales: totals.net,
      transactionCount: Number(totals.count),
      averageTransactionValue: Number(totals.count)
        ? (Number(totals.net) / Number(totals.count)).toFixed(2)
        : '0.00',
      byPaymentMethod: await this.database.db
        .select({
          paymentMethod: transactions.paymentMethod,
          gross: sql<string>`coalesce(sum(${transactions.subtotalAmount}),0)`,
          discount: sql<string>`coalesce(sum(${transactions.discountAmount}),0)`,
          net: sql<string>`coalesce(sum(${transactions.totalAmount}),0)`,
          count: count(),
        })
        .from(transactions)
        .where(
          and(
            ...this.dateFilter(q, transactions.createdAt),
            eq(transactions.status, 'COMPLETED'),
            ...(q.userId ? [eq(transactions.userId, q.userId)] : []),
          ),
        )
        .groupBy(transactions.paymentMethod),
      transactions: {
        data,
        page: q.page,
        limit: q.limit,
        total: Number(n.total),
      },
    };
  }
  async inventory(q: ReportQueryDto) {
    const invFilters = [];
    if (q.productId) invFilters.push(eq(inventories.productId, q.productId));
    if (q.location) invFilters.push(eq(inventories.location, q.location));
    const productFilters = q.categoryId
      ? eq(products.categoryId, q.categoryId)
      : undefined;
    const balances = await this.database.db
      .select({
        productId: products.id,
        productName: products.name,
        categoryId: categories.id,
        categoryName: categories.name,
        location: inventories.location,
        stock: inventories.stock,
      })
      .from(inventories)
      .innerJoin(products, eq(products.id, inventories.productId))
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(and(...invFilters, productFilters))
      .orderBy(products.name);
    const movementFilters = this.dateFilter(q, inventoryMovements.createdAt);
    if (q.productId)
      movementFilters.push(eq(inventoryMovements.productId, q.productId));
    if (q.location)
      movementFilters.push(
        sql`(${inventoryMovements.fromLocation} = ${q.location} OR ${inventoryMovements.toLocation} = ${q.location})`,
      );
    if (q.categoryId)
      movementFilters.push(eq(products.categoryId, q.categoryId));
    const movementWhere = and(...movementFilters);
    const movements = this.database.db
      .select({
        id: inventoryMovements.id,
        productId: inventoryMovements.productId,
        productName: products.name,
        type: inventoryMovements.type,
        quantity: inventoryMovements.quantity,
        fromLocation: inventoryMovements.fromLocation,
        toLocation: inventoryMovements.toLocation,
        userId: inventoryMovements.userId,
        transactionId: inventoryMovements.transactionId,
        createdAt: inventoryMovements.createdAt,
      })
      .from(inventoryMovements)
      .innerJoin(products, eq(products.id, inventoryMovements.productId))
      .where(movementWhere)
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(q.limit)
      .offset((q.page - 1) * q.limit);
    return {
      balances,
      movements: await this.page(
        movements,
        this.database.db
          .select({ total: count() })
          .from(inventoryMovements)
          .innerJoin(products, eq(products.id, inventoryMovements.productId))
          .where(movementWhere),
        q,
      ),
    };
  }
  async cash(q: ReportQueryDto) {
    const dateFilters = this.dateFilter(q, transactions.createdAt);
    const shiftFilter = q.shiftId ? eq(shifts.id, q.shiftId) : undefined;
    const userFilter = q.userId ? eq(shifts.userId, q.userId) : undefined;
    const base = and(...dateFilters, shiftFilter, userFilter);
    const [summary] = await this.database.db
      .select({
        cashSales: sql<string>`coalesce(sum(case when ${transactions.status}='COMPLETED' and ${transactions.paymentMethod}='CASH' then ${transactions.totalAmount} else 0 end),0)`,
        qrisSales: sql<string>`coalesce(sum(case when ${transactions.status}='COMPLETED' and ${transactions.paymentMethod}='QRIS' then ${transactions.totalAmount} else 0 end),0)`,
        voidCount: sql<number>`count(*) filter (where ${transactions.status}='VOIDED')`,
        voidValue: sql<string>`coalesce(sum(${transactions.totalAmount}) filter (where ${transactions.status}='VOIDED'),0)`,
      })
      .from(transactions)
      .innerJoin(shifts, eq(shifts.id, transactions.shiftId))
      .where(base);
    const movementFilters = this.dateFilter(q, cashMovements.createdAt);
    if (q.shiftId) movementFilters.push(eq(cashMovements.shiftId, q.shiftId));
    if (q.userId) movementFilters.push(eq(shifts.userId, q.userId));
    const [moves] = await this.database.db
      .select({
        cashIn: sql<string>`coalesce(sum(${cashMovements.amount}) filter(where ${cashMovements.type}='IN'),0)`,
        cashOut: sql<string>`coalesce(sum(${cashMovements.amount}) filter(where ${cashMovements.type}='OUT'),0)`,
      })
      .from(cashMovements)
      .innerJoin(shifts, eq(shifts.id, cashMovements.shiftId))
      .where(and(...movementFilters));
    const rows = this.database.db
      .select({
        transaction: transactions,
        shiftId: shifts.id,
        cashierId: shifts.userId,
      })
      .from(transactions)
      .innerJoin(shifts, eq(shifts.id, transactions.shiftId))
      .where(base)
      .orderBy(desc(transactions.createdAt))
      .limit(q.limit)
      .offset((q.page - 1) * q.limit);
    const total = this.database.db
      .select({ total: count() })
      .from(transactions)
      .innerJoin(shifts, eq(shifts.id, transactions.shiftId))
      .where(base);
    const [data, [n]] = await Promise.all([rows, total]);
    return {
      ...summary,
      ...moves,
      voidCount: Number(summary.voidCount),
      transactions: {
        data,
        page: q.page,
        limit: q.limit,
        total: Number(n.total),
      },
    };
  }
  async shifts(q: ReportQueryDto) {
    const filters = this.dateFilter(q, shifts.openedAt);
    if (q.userId) filters.push(eq(shifts.userId, q.userId));
    if (q.status)
      filters.push(
        q.status === 'OPEN'
          ? sql`${shifts.closedAt} is null`
          : sql`${shifts.closedAt} is not null`,
      );
    const where = and(...filters);
    const rows = this.database.db
      .select({
        shift: shifts,
        username: users.username,
        transactionCount: sql<number>`(select count(*)::int from ${transactions} where ${transactions.shiftId}=${shifts.id} and ${transactions.status}='COMPLETED')`,
        calculatedExpectedCash: sql<string>`(${shifts.openingCash}+coalesce((select sum(${transactions.totalAmount}) from ${transactions} where ${transactions.shiftId}=${shifts.id} and ${transactions.status}='COMPLETED' and ${transactions.paymentMethod}='CASH'),0)+coalesce((select sum(case when ${cashMovements.type}='IN' then ${cashMovements.amount} else -${cashMovements.amount} end) from ${cashMovements} where ${cashMovements.shiftId}=${shifts.id}),0))::numeric(10,2)`,
      })
      .from(shifts)
      .innerJoin(users, eq(users.id, shifts.userId))
      .where(where)
      .orderBy(desc(shifts.openedAt))
      .limit(q.limit)
      .offset((q.page - 1) * q.limit);
    const total = this.database.db
      .select({ total: count() })
      .from(shifts)
      .where(where);
    const [data, [n]] = await Promise.all([rows, total]);
    return {
      data: data.map(
        ({ shift, username, transactionCount, calculatedExpectedCash }) => ({
          ...shift,
          username,
          transactionCount: Number(transactionCount),
          expectedCash: shift.closedAt
            ? shift.expectedCash
            : calculatedExpectedCash,
          closingCash: shift.closedAt ? shift.closingCash : null,
          cashDifference: shift.closedAt ? shift.cashDifference : null,
        }),
      ),
      page: q.page,
      limit: q.limit,
      total: Number(n.total),
    };
  }
}
