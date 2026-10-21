import { BadRequestException, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, lt, sql, sum } from 'drizzle-orm';
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
import type { OverviewQueryDto } from './dto/overview-query.dto.js';

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

  async overview(q: OverviewQueryDto) {
    const start = new Date(q.startDate);
    const end = new Date(q.endDate);
    // endDate is inclusive: advance to start of next day
    if (/^\d{4}-\d{2}-\d{2}$/.test(q.endDate))
      end.setUTCDate(end.getUTCDate() + 1);

    const completedInRange = and(
      gte(transactions.createdAt, start),
      lt(transactions.createdAt, end),
      eq(transactions.status, 'COMPLETED'),
    );

    // --- Previous period (same duration, immediately before start) ---
    const durationMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - durationMs);
    const prevEnd = start;
    const completedInPrev = and(
      gte(transactions.createdAt, prevStart),
      lt(transactions.createdAt, prevEnd),
      eq(transactions.status, 'COMPLETED'),
    );

    // For weekly heatmap: if interval is < 7 days (e.g. Today or Yesterday),
    // look back 30 days ending at `end` so the Mon-Sun weekly distribution has context,
    // while the frontend highlights the selected day.
    const heatmapStart =
      durationMs < 7 * 24 * 60 * 60 * 1000
        ? new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
        : start;

    const heatmapWhere = and(
      gte(transactions.createdAt, heatmapStart),
      lt(transactions.createdAt, end),
      eq(transactions.status, 'COMPLETED'),
    );

    // 1. Summary totals for current and previous period (parallel)
    const summarySelect = {
      totalSales: sql<string>`coalesce(sum(${transactions.totalAmount}),0)`,
      totalDiscount: sql<string>`coalesce(sum(${transactions.discountAmount}),0)`,
      transactionCount: count(),
    };

    const [[current], [previous], dailySales, topProducts, hourlyHeatmap] =
      await Promise.all([
        this.database.db
          .select(summarySelect)
          .from(transactions)
          .where(completedInRange),
        this.database.db
          .select(summarySelect)
          .from(transactions)
          .where(completedInPrev),

        // 2. Daily sales (for the chart, extend to cover a rolling window)
        this.dailySalesForChart(q),

        // 3. Best selling products
        this.database.db
          .select({
            productId: transactionItems.productId,
            productName: transactionItems.productName,
            categoryName: categories.name,
            quantitySold: sql<string>`coalesce(sum(${transactionItems.quantity}),0)`,
            totalSales: sql<string>`coalesce(sum(${transactionItems.subtotalAmount}),0)`,
          })
          .from(transactionItems)
          .innerJoin(
            transactions,
            eq(transactionItems.transactionId, transactions.id),
          )
          .innerJoin(products, eq(transactionItems.productId, products.id))
          .innerJoin(categories, eq(categories.id, products.categoryId))
          .where(completedInRange)
          .groupBy(
            transactionItems.productId,
            transactionItems.productName,
            categories.name,
          )
          .orderBy(desc(sql`sum(${transactionItems.quantity})`))
          .limit(50),

        // 4. Hourly heatmap: day-of-week × hour-of-day (Asia/Jakarta timezone)
        this.database.db
          .select({
            dow: sql<number>`extract(dow from ${transactions.createdAt} at time zone 'Asia/Jakarta')`.as(
              'dow',
            ),
            hour: sql<number>`extract(hour from ${transactions.createdAt} at time zone 'Asia/Jakarta')`.as(
              'hour',
            ),
            transactionCount: count(),
            totalSales: sql<string>`coalesce(sum(${transactions.totalAmount}),0)`,
          })
          .from(transactions)
          .where(heatmapWhere)
          .groupBy(
            sql`extract(dow from ${transactions.createdAt} at time zone 'Asia/Jakarta')`,
            sql`extract(hour from ${transactions.createdAt} at time zone 'Asia/Jakarta')`,
          )
          .orderBy(
            sql`extract(dow from ${transactions.createdAt} at time zone 'Asia/Jakarta')`,
            sql`extract(hour from ${transactions.createdAt} at time zone 'Asia/Jakarta')`,
          ),
      ]);

    const curSales = Number(current.totalSales);
    const prevSales = Number(previous.totalSales);
    const curCount = Number(current.transactionCount);
    const prevCount = Number(previous.transactionCount);
    const curDiscount = Number(current.totalDiscount);
    const prevDiscount = Number(previous.totalDiscount);
    const curNetProfit = curSales - curDiscount;
    const prevNetProfit = prevSales - prevDiscount;

    const pctChange = (cur: number, prev: number) =>
      prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;

    return {
      period: { startDate: q.startDate, endDate: q.endDate },
      kpis: {
        sales: {
          value: curSales,
          previous: prevSales,
          change: pctChange(curSales, prevSales),
        },
        netProfit: {
          value: curNetProfit,
          previous: prevNetProfit,
          change: pctChange(curNetProfit, prevNetProfit),
        },
        transactions: {
          value: curCount,
          previous: prevCount,
          change: pctChange(curCount, prevCount),
        },
        avgTransaction: {
          value: curCount > 0 ? curSales / curCount : 0,
          previous: prevCount > 0 ? prevSales / prevCount : 0,
          change: pctChange(
            curCount > 0 ? curSales / curCount : 0,
            prevCount > 0 ? prevSales / prevCount : 0,
          ),
        },
      },
      dailySales: dailySales.map((d) => ({
        date: d.date,
        totalSales: Number(d.totalSales ?? 0),
        transactionCount: Number(d.transactionCount ?? 0),
      })),
      products: topProducts.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        categoryName: p.categoryName,
        quantitySold: Number(p.quantitySold ?? 0),
        totalSales: Number(p.totalSales ?? 0),
      })),
      hourlyHeatmap: hourlyHeatmap.map((h) => ({
        dow: Number(h.dow),
        hour: Number(h.hour),
        transactionCount: Number(h.transactionCount),
        totalSales: Number(h.totalSales ?? 0),
      })),
    };
  }

  /**
   * Daily sales for the overview chart.
   * If the requested range is shorter than 30 days, extend backwards so the
   * chart always has ~30 bars (rolling window). Otherwise use the range as-is.
   */
  private async dailySalesForChart(q: OverviewQueryDto) {
    const from = new Date(q.startDate);
    const to = new Date(q.endDate);
    if (/^\d{4}-\d{2}-\d{2}$/.test(q.endDate))
      to.setUTCDate(to.getUTCDate() + 1);

    const daysDiff = Math.ceil(
      (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
    );

    let chartStart: Date;
    const chartEnd = to;
    if (daysDiff < 28) {
      chartStart = new Date(to);
      chartStart.setUTCDate(chartStart.getUTCDate() - 30);
    } else {
      chartStart = from;
    }

    return this.database.db
      .select({
        date: sql<string>`to_char(DATE(${transactions.createdAt} at time zone 'Asia/Jakarta'), 'YYYY-MM-DD')`.as(
          'date',
        ),
        totalSales: sql<string>`coalesce(sum(${transactions.totalAmount}),0)`,
        transactionCount: count(),
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, chartStart),
          lt(transactions.createdAt, chartEnd),
          eq(transactions.status, 'COMPLETED'),
        ),
      )
      .groupBy(sql`DATE(${transactions.createdAt} at time zone 'Asia/Jakarta')`)
      .orderBy(
        sql`DATE(${transactions.createdAt} at time zone 'Asia/Jakarta')`,
      );
  }
}
