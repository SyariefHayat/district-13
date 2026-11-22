import { BadRequestException, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, inArray, lt, sql, sum } from 'drizzle-orm';
import type { Response } from 'express';
import ExcelJS from 'exceljs';
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
import type { ProfitQueryDto } from './dto/profit-query.dto.js';
import type { ExportQueryDto } from './dto/export-query.dto.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { getWibBusinessDate } from '../common/utils/formatters.js';

@Injectable()
export class ReportsService {
  constructor(private readonly database: DatabaseService) {}
  private dateFilter(q: { startDate?: string; endDate?: string }, column: any) {
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
      .select({
        id: transactions.id,
        transactionNumber: transactions.transactionNumber,
        shiftId: transactions.shiftId,
        userId: transactions.userId,
        cashierUsername: users.username,
        subtotalAmount: transactions.subtotalAmount,
        discountAmount: transactions.discountAmount,
        discountReason: transactions.discountReason,
        totalAmount: transactions.totalAmount,
        paymentMethod: transactions.paymentMethod,
        paidAmount: transactions.paidAmount,
        changeAmount: transactions.changeAmount,
        status: transactions.status,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .leftJoin(users, eq(users.id, transactions.userId))
      .where(where)
      .orderBy(desc(transactions.createdAt))
      .limit(q.limit)
      .offset((q.page - 1) * q.limit);
    const total = this.database.db
      .select({ total: count() })
      .from(transactions)
      .where(where);
    const [data, [n]] = await Promise.all([rows, total]);

    const txIds = data.map((t) => t.id);
    const itemsMap: Record<string, any[]> = {};
    if (txIds.length > 0) {
      const items = await this.database.db
        .select({
          id: transactionItems.id,
          transactionId: transactionItems.transactionId,
          productId: transactionItems.productId,
          productName: transactionItems.productName,
          quantity: transactionItems.quantity,
          unitPrice: transactionItems.unitPrice,
          subtotalAmount: transactionItems.subtotalAmount,
        })
        .from(transactionItems)
        .where(inArray(transactionItems.transactionId, txIds));

      for (const item of items) {
        if (!itemsMap[item.transactionId]) {
          itemsMap[item.transactionId] = [];
        }
        itemsMap[item.transactionId].push({
          id: item.id,
          productName: item.productName,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          subtotalAmount: Number(item.subtotalAmount) || 0,
        });
      }
    }

    const mappedData = data.map((t) => ({
      ...t,
      subtotalAmount: Number(t.subtotalAmount) || 0,
      discountAmount: Number(t.discountAmount) || 0,
      totalAmount: Number(t.totalAmount) || 0,
      paidAmount: Number(t.paidAmount) || 0,
      changeAmount: Number(t.changeAmount) || 0,
      items: itemsMap[t.id] || [],
    }));

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
        data: mappedData,
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

    const movementDateFilters = this.dateFilter(q, cashMovements.createdAt);
    const summaryMovementFilters = [...movementDateFilters];
    if (q.shiftId)
      summaryMovementFilters.push(eq(cashMovements.shiftId, q.shiftId));
    if (q.userId)
      summaryMovementFilters.push(eq(cashMovements.recordedBy, q.userId));

    const listMovementFilters = [...summaryMovementFilters];
    if (q.type) listMovementFilters.push(eq(cashMovements.type, q.type));

    const [moves] = await this.database.db
      .select({
        cashIn: sql<string>`coalesce(sum(${cashMovements.amount}) filter(where ${cashMovements.type}='IN'),0)`,
        cashOut: sql<string>`coalesce(sum(${cashMovements.amount}) filter(where ${cashMovements.type}='OUT'),0)`,
        inCount: sql<number>`count(*) filter (where ${cashMovements.type}='IN')`,
        outCount: sql<number>`count(*) filter (where ${cashMovements.type}='OUT')`,
        totalCount: count(),
      })
      .from(cashMovements)
      .where(and(...summaryMovementFilters));

    const movementRows = this.database.db
      .select({
        id: cashMovements.id,
        shiftId: cashMovements.shiftId,
        recordedBy: cashMovements.recordedBy,
        username: users.username,
        type: cashMovements.type,
        amount: sql<string>`${cashMovements.amount}::text`,
        description: cashMovements.description,
        createdAt: cashMovements.createdAt,
      })
      .from(cashMovements)
      .leftJoin(users, eq(users.id, cashMovements.recordedBy))
      .where(and(...listMovementFilters))
      .orderBy(desc(cashMovements.createdAt))
      .limit(q.limit)
      .offset((q.page - 1) * q.limit);

    const movementTotalQuery = this.database.db
      .select({ total: count() })
      .from(cashMovements)
      .where(and(...listMovementFilters));

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

    const [moveData, [moveCount], data, [n]] = await Promise.all([
      movementRows,
      movementTotalQuery,
      rows,
      total,
    ]);

    const cashInVal = Number(moves?.cashIn || 0);
    const cashOutVal = Number(moves?.cashOut || 0);
    const netCashFlow = cashInVal - cashOutVal;

    return {
      cashSales: summary.cashSales,
      qrisSales: summary.qrisSales,
      voidCount: Number(summary.voidCount),
      voidValue: summary.voidValue,
      cashIn: moves?.cashIn || '0',
      cashOut: moves?.cashOut || '0',
      netCashFlow: netCashFlow.toFixed(2),
      inCount: Number(moves?.inCount || 0),
      outCount: Number(moves?.outCount || 0),
      totalCount: Number(moves?.totalCount || 0),
      summary: {
        cashSales: summary.cashSales,
        qrisSales: summary.qrisSales,
        voidCount: Number(summary.voidCount),
        voidValue: summary.voidValue,
      },
      moves: {
        cashIn: moves?.cashIn || '0',
        cashOut: moves?.cashOut || '0',
      },
      movements: {
        data: moveData.map((m) => ({
          id: m.id,
          shiftId: m.shiftId,
          recordedBy: m.recordedBy,
          username: m.username,
          type: m.type,
          amount: Number(m.amount) || 0,
          description: m.description || '',
          createdAt: m.createdAt,
        })),
        page: q.page,
        limit: q.limit,
        total: Number(moveCount.total),
      },
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
    const summaryStatsQuery = this.database.db
      .select({
        totalShifts: count(),
        openShifts: sql<number>`count(*) filter (where ${shifts.closedAt} is null)`,
        closedShifts: sql<number>`count(*) filter (where ${shifts.closedAt} is not null)`,
        totalClosingCash: sql<string>`coalesce(sum(case when ${shifts.closedAt} is not null then ${shifts.closingCash} else ${shifts.openingCash} end), 0)`,
        totalCashDifference: sql<string>`coalesce(sum(${shifts.cashDifference} filter (where ${shifts.closedAt} is not null)), 0)`,
        totalTransactions: sql<number>`coalesce(sum((select count(*)::int from ${transactions} where ${transactions.shiftId}=${shifts.id} and ${transactions.status}='COMPLETED')), 0)`,
      })
      .from(shifts)
      .where(where);

    const [data, [n], [summaryStats]] = await Promise.all([
      rows,
      total,
      summaryStatsQuery,
    ]);

    return {
      summary: {
        totalShifts: Number(summaryStats?.totalShifts || 0),
        openShifts: Number(summaryStats?.openShifts || 0),
        closedShifts: Number(summaryStats?.closedShifts || 0),
        totalClosingCash: Number(summaryStats?.totalClosingCash || 0),
        totalCashDifference: Number(summaryStats?.totalCashDifference || 0),
        totalTransactions: Number(summaryStats?.totalTransactions || 0),
      },
      data: data.map(
        ({ shift, username, transactionCount, calculatedExpectedCash }) => ({
          ...shift,
          username,
          openingCash: Number(shift.openingCash) || 0,
          expectedCash:
            Number(
              shift.closedAt ? shift.expectedCash : calculatedExpectedCash,
            ) || 0,
          closingCash:
            shift.closedAt && shift.closingCash !== null
              ? Number(shift.closingCash)
              : null,
          cashDifference:
            shift.closedAt && shift.cashDifference !== null
              ? Number(shift.cashDifference)
              : null,
          transactionCount: Number(transactionCount),
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

  async profit(q: ProfitQueryDto) {
    const whereFilters = [
      ...this.dateFilter(q, transactions.createdAt),
      eq(transactions.status, 'COMPLETED'),
    ];
    if (q.categoryId) {
      whereFilters.push(eq(products.categoryId, q.categoryId));
    }
    if (q.category && q.category !== 'Semua Kategori') {
      whereFilters.push(eq(categories.name, q.category));
    }
    const where = and(...whereFilters);

    // 1. Overall Summary
    const [summaryResult] = await this.database.db
      .select({
        totalRevenue: sql<string>`coalesce(sum(${transactionItems.subtotalAmount}), 0)`,
        totalCogs: sql<string>`coalesce(sum(${transactionItems.quantity} * coalesce(${products.costPrice}, 0)), 0)`,
        totalUnitsSold: sql<number>`coalesce(sum(${transactionItems.quantity}), 0)::int`,
        productCount: sql<number>`count(distinct ${transactionItems.productId})::int`,
      })
      .from(transactionItems)
      .innerJoin(
        transactions,
        eq(transactionItems.transactionId, transactions.id),
      )
      .innerJoin(products, eq(transactionItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where);

    // Transaction discount total in period
    const [discountResult] = await this.database.db
      .select({
        totalDiscount: sql<string>`coalesce(sum(${transactions.discountAmount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          ...this.dateFilter(q, transactions.createdAt),
          eq(transactions.status, 'COMPLETED'),
        ),
      );

    const totalRev = Number(summaryResult?.totalRevenue || 0);
    const totalCogs = Number(summaryResult?.totalCogs || 0);
    const totalDiscount = Number(discountResult?.totalDiscount || 0);
    const grossProfit = totalRev - totalCogs;
    const netProfit = grossProfit - totalDiscount;
    const profitMargin = totalRev > 0 ? (grossProfit / totalRev) * 100 : 0;

    // 2. Product-level breakdown (paginated)
    const productRowsPromise = this.database.db
      .select({
        id: products.id,
        name: products.name,
        sku: sql<string>`coalesce(${products.sku}, '')`,
        category: sql<string>`coalesce(${categories.name}, 'Umum')`,
        categoryId: categories.id,
        sellingPrice: sql<string>`coalesce(${products.price}, 0)`,
        costPrice: sql<string>`coalesce(${products.costPrice}, 0)`,
        unitsSold: sql<number>`coalesce(sum(${transactionItems.quantity}), 0)::int`,
        totalRevenue: sql<string>`coalesce(sum(${transactionItems.subtotalAmount}), 0)`,
        totalCogs: sql<string>`coalesce(sum(${transactionItems.quantity} * coalesce(${products.costPrice}, 0)), 0)`,
        grossProfit: sql<string>`coalesce(sum(${transactionItems.subtotalAmount}) - sum(${transactionItems.quantity} * coalesce(${products.costPrice}, 0)), 0)`,
      })
      .from(transactionItems)
      .innerJoin(
        transactions,
        eq(transactionItems.transactionId, transactions.id),
      )
      .innerJoin(products, eq(transactionItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .groupBy(
        products.id,
        products.name,
        products.sku,
        products.price,
        products.costPrice,
        categories.name,
        categories.id,
      )
      .orderBy(desc(sql`sum(${transactionItems.subtotalAmount})`))
      .limit(q.limit)
      .offset((q.page - 1) * q.limit);

    const totalProductsCountPromise = this.database.db
      .select({
        total: sql<number>`count(distinct ${transactionItems.productId})::int`,
      })
      .from(transactionItems)
      .innerJoin(
        transactions,
        eq(transactionItems.transactionId, transactions.id),
      )
      .innerJoin(products, eq(transactionItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where);

    // 3. Category-level breakdown
    const categoryRowsPromise = this.database.db
      .select({
        category: sql<string>`coalesce(${categories.name}, 'Umum')`,
        categoryId: categories.id,
        unitsSold: sql<number>`coalesce(sum(${transactionItems.quantity}), 0)::int`,
        totalRevenue: sql<string>`coalesce(sum(${transactionItems.subtotalAmount}), 0)`,
        totalCogs: sql<string>`coalesce(sum(${transactionItems.quantity} * coalesce(${products.costPrice}, 0)), 0)`,
        grossProfit: sql<string>`coalesce(sum(${transactionItems.subtotalAmount}) - sum(${transactionItems.quantity} * coalesce(${products.costPrice}, 0)), 0)`,
      })
      .from(transactionItems)
      .innerJoin(
        transactions,
        eq(transactionItems.transactionId, transactions.id),
      )
      .innerJoin(products, eq(transactionItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .groupBy(categories.name, categories.id)
      .orderBy(desc(sql`sum(${transactionItems.subtotalAmount})`));

    const [productRows, [totalCount], categoryRows] = await Promise.all([
      productRowsPromise,
      totalProductsCountPromise,
      categoryRowsPromise,
    ]);

    const mappedProducts = productRows.map((p) => {
      const pRev = Number(p.totalRevenue || 0);
      const pCogs = Number(p.totalCogs || 0);
      const pGross = Number(p.grossProfit || 0);
      const pMargin = pRev > 0 ? (pGross / pRev) * 100 : 0;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        categoryId: p.categoryId,
        unitsSold: Number(p.unitsSold || 0),
        sellingPrice: Number(p.sellingPrice || 0),
        costPrice: Number(p.costPrice || 0),
        totalRevenue: pRev,
        totalCogs: pCogs,
        grossProfit: pGross,
        profitMargin: Number(pMargin.toFixed(1)),
      };
    });

    const mappedCategories = categoryRows.map((c) => {
      const cRev = Number(c.totalRevenue || 0);
      const cCogs = Number(c.totalCogs || 0);
      const cGross = Number(c.grossProfit || 0);
      const cMargin = cRev > 0 ? (cGross / cRev) * 100 : 0;
      return {
        category: c.category,
        categoryId: c.categoryId,
        unitsSold: Number(c.unitsSold || 0),
        totalRevenue: cRev,
        totalCogs: cCogs,
        grossProfit: cGross,
        profitMargin: Number(cMargin.toFixed(1)),
      };
    });

    return {
      summary: {
        totalRevenue: totalRev,
        netRevenue: totalRev - totalDiscount,
        totalCogs,
        grossProfit,
        netProfit,
        profitMargin: Number(profitMargin.toFixed(1)),
        totalUnitsSold: Number(summaryResult?.totalUnitsSold || 0),
        productCount: Number(summaryResult?.productCount || 0),
      },
      products: {
        data: mappedProducts,
        page: q.page,
        limit: q.limit,
        total: Number(totalCount?.total || 0),
      },
      byCategory: mappedCategories,
    };
  }

  async cashierPerformance(q: ReportQueryDto) {
    const shiftFilters = this.dateFilter(q, shifts.openedAt);
    const txFilters = this.dateFilter(q, transactions.createdAt);

    if (q.userId) {
      shiftFilters.push(eq(shifts.userId, q.userId));
      txFilters.push(eq(transactions.userId, q.userId));
    }

    // 1. Get all relevant cashier users
    const userFilters = [];
    if (q.userId) {
      userFilters.push(eq(users.id, q.userId));
    } else {
      userFilters.push(eq(users.role, 'CASHIER'));
    }

    const cashierUsers = await this.database.db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
      })
      .from(users)
      .where(and(...userFilters));

    // 2. Fetch shifts aggregation per user in period
    const shiftsAgg = await this.database.db
      .select({
        userId: shifts.userId,
        totalShifts: sql<number>`count(*)::int`,
        cashExpected: sql<string>`coalesce(sum(${shifts.expectedCash}), 0)`,
        cashActual: sql<string>`coalesce(sum(${shifts.closingCash}), 0)`,
        cashDifference: sql<string>`coalesce(sum(${shifts.cashDifference}), 0)`,
        lastShiftDate: sql<string>`max(${shifts.closedAt})`,
      })
      .from(shifts)
      .where(and(...shiftFilters, sql`${shifts.closedAt} is not null`))
      .groupBy(shifts.userId);

    // 3. Fetch completed & voided transactions aggregation per user in period
    const txCompletedAgg = await this.database.db
      .select({
        userId: transactions.userId,
        totalTransactions: sql<number>`count(*)::int`,
        totalSales: sql<string>`coalesce(sum(${transactions.totalAmount}), 0)`,
        discountCount: sql<number>`count(case when ${transactions.discountAmount} > 0 then 1 end)::int`,
        discountAmount: sql<string>`coalesce(sum(${transactions.discountAmount}), 0)`,
        lastTxDate: sql<string>`max(${transactions.createdAt})`,
      })
      .from(transactions)
      .where(and(...txFilters, eq(transactions.status, 'COMPLETED')))
      .groupBy(transactions.userId);

    const txVoidAgg = await this.database.db
      .select({
        userId: transactions.userId,
        voidCount: sql<number>`count(*)::int`,
        voidAmount: sql<string>`coalesce(sum(${transactions.totalAmount}), 0)`,
      })
      .from(transactions)
      .where(and(...txFilters, eq(transactions.status, 'VOIDED')))
      .groupBy(transactions.userId);

    const shiftsMap = new Map(shiftsAgg.map((s) => [s.userId, s]));
    const txMap = new Map(txCompletedAgg.map((t) => [t.userId, t]));
    const voidMap = new Map(txVoidAgg.map((v) => [v.userId, v]));

    const items = cashierUsers.map((u, idx) => {
      const s = shiftsMap.get(u.id);
      const t = txMap.get(u.id);
      const v = voidMap.get(u.id);

      const totalShifts = Number(s?.totalShifts || 0);
      const totalTransactions = Number(t?.totalTransactions || 0);
      const totalSales = Number(t?.totalSales || 0);
      const cashExpected = Number(s?.cashExpected || 0);
      const cashActual = Number(s?.cashActual || 0);
      const cashDifference = Number(s?.cashDifference || 0);

      const voidCount = Number(v?.voidCount || 0);
      const voidAmount = Number(v?.voidAmount || 0);
      const discountCount = Number(t?.discountCount || 0);
      const discountAmount = Number(t?.discountAmount || 0);

      let accuracyRate = 100;
      if (cashExpected > 0) {
        const diffRatio = (Math.abs(cashDifference) / cashExpected) * 100;
        accuracyRate = Math.max(0, Number((100 - diffRatio).toFixed(1)));
      }

      let auditStatus: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
      if (
        Math.abs(cashDifference) > 50000 ||
        accuracyRate < 95 ||
        voidCount >= 5
      ) {
        auditStatus = 'CRITICAL';
      } else if (
        Math.abs(cashDifference) > 10000 ||
        accuracyRate < 99 ||
        voidCount >= 3
      ) {
        auditStatus = 'WARNING';
      }

      let notes = 'Rekonsiliasi kas baik tanpa selisih signifikan.';
      if (cashDifference === 0 && totalShifts > 0) {
        notes = 'Rekonsiliasi kas sempurna tanpa selisih.';
      } else if (auditStatus === 'WARNING') {
        notes =
          'Selisih kas berulang atau terdapat pembatalan transaksi, perlu evaluasi.';
      } else if (auditStatus === 'CRITICAL') {
        notes =
          'Selisih kas signifikan melampaui batas toleransi, perlu audit khusus.';
      }

      const cashierCode = `KSR-${String(idx + 1).padStart(3, '0')}`;
      const lastAuditDate =
        s?.lastShiftDate || t?.lastTxDate || new Date().toISOString();

      return {
        id: `ca-${u.id.slice(0, 8)}`,
        cashierId: u.id,
        cashierName: u.username,
        cashierCode,
        role: u.role === 'CASHIER' ? 'Kasir' : u.role,
        totalShifts,
        totalTransactions,
        totalSales,
        cashExpected,
        cashActual,
        cashDifference,
        accuracyRate,
        voidCount,
        voidAmount,
        discountCount,
        discountAmount,
        auditStatus,
        lastAuditDate,
        notes,
      };
    });

    // Summary
    const totalTransactions = items.reduce(
      (sum, i) => sum + i.totalTransactions,
      0,
    );
    const totalSales = items.reduce((sum, i) => sum + i.totalSales, 0);
    const totalDifference = items.reduce((sum, i) => sum + i.cashDifference, 0);
    const totalVoidCount = items.reduce((sum, i) => sum + i.voidCount, 0);
    const totalVoidAmount = items.reduce((sum, i) => sum + i.voidAmount, 0);
    const avgAccuracy =
      items.length > 0
        ? Number(
            (
              items.reduce((sum, i) => sum + i.accuracyRate, 0) / items.length
            ).toFixed(1),
          )
        : 100;

    const summary = {
      totalCashiers: items.length,
      totalTransactions,
      totalSales,
      totalDifference,
      averageAccuracy: avgAccuracy,
      totalVoidCount,
      totalVoidAmount,
    };

    // Pagination
    const offset = (q.page - 1) * q.limit;
    const paginatedItems = items.slice(offset, offset + q.limit);

    return {
      summary,
      cashiers: {
        data: paginatedItems,
        page: q.page,
        limit: q.limit,
        total: items.length,
      },
    };
  }

  async dashboard(q: OverviewQueryDto, userRole?: string) {
    const result = await this.overview(q);
    // Busy hours heatmap is restricted to Owner and Admin only (T-53)
    if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
      return {
        ...result,
        hourlyHeatmap: [],
      };
    }
    return result;
  }

  async products(q: ReportQueryDto) {
    const txWhere = [
      ...this.dateFilter(q, transactions.createdAt),
      eq(transactions.status, 'COMPLETED'),
    ];
    if (q.productId) txWhere.push(eq(transactionItems.productId, q.productId));
    if (q.categoryId) txWhere.push(eq(products.categoryId, q.categoryId));

    const rows = await this.database.db
      .select({
        productId: transactionItems.productId,
        productName: transactionItems.productName,
        categoryId: products.categoryId,
        categoryName: sql<string>`coalesce(${categories.name}, 'Umum')`,
        quantitySold: sql<number>`coalesce(sum(${transactionItems.quantity}), 0)::int`,
        totalRevenue: sql<string>`coalesce(sum(${transactionItems.subtotalAmount}), 0)`,
      })
      .from(transactionItems)
      .innerJoin(
        transactions,
        eq(transactionItems.transactionId, transactions.id),
      )
      .innerJoin(products, eq(transactionItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...txWhere))
      .groupBy(
        transactionItems.productId,
        transactionItems.productName,
        products.categoryId,
        categories.name,
      )
      .orderBy(desc(sql`sum(${transactionItems.subtotalAmount})`));

    const totalQuantity = rows.reduce(
      (acc, r) => acc + Number(r.quantitySold || 0),
      0,
    );
    const totalRevenue = rows.reduce(
      (acc, r) => acc + Number(r.totalRevenue || 0),
      0,
    );

    const page = q.page || 1;
    const limit = q.limit || 20;
    const offset = (page - 1) * limit;
    const pagedData = rows.slice(offset, offset + limit).map((r) => {
      const qty = Number(r.quantitySold || 0);
      const rev = Number(r.totalRevenue || 0);
      return {
        productId: r.productId,
        productName: r.productName,
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        quantitySold: qty,
        totalRevenue: rev,
        averagePrice: qty > 0 ? Number((rev / qty).toFixed(2)) : 0,
      };
    });

    return {
      summary: {
        totalProducts: rows.length,
        totalQuantitySold: totalQuantity,
        totalRevenue,
      },
      data: pagedData,
      page,
      limit,
      total: rows.length,
    };
  }

  async cashEntries(q: ReportQueryDto) {
    const movementDateFilters = this.dateFilter(q, cashMovements.createdAt);
    const filters = [...movementDateFilters];
    if (q.shiftId) filters.push(eq(cashMovements.shiftId, q.shiftId));
    if (q.userId) filters.push(eq(cashMovements.recordedBy, q.userId));
    if (q.type) filters.push(eq(cashMovements.type, q.type));

    const where = and(...filters);

    const [moves] = await this.database.db
      .select({
        cashIn: sql<string>`coalesce(sum(${cashMovements.amount}) filter(where ${cashMovements.type}='IN'),0)`,
        cashOut: sql<string>`coalesce(sum(${cashMovements.amount}) filter(where ${cashMovements.type}='OUT'),0)`,
        inCount: sql<number>`count(*) filter (where ${cashMovements.type}='IN')`,
        outCount: sql<number>`count(*) filter (where ${cashMovements.type}='OUT')`,
        totalCount: count(),
      })
      .from(cashMovements)
      .where(where);

    const rows = await this.database.db
      .select({
        id: cashMovements.id,
        shiftId: cashMovements.shiftId,
        recordedBy: cashMovements.recordedBy,
        username: users.username,
        type: cashMovements.type,
        amount: sql<string>`${cashMovements.amount}::text`,
        description: cashMovements.description,
        createdAt: cashMovements.createdAt,
      })
      .from(cashMovements)
      .leftJoin(users, eq(users.id, cashMovements.recordedBy))
      .where(where)
      .orderBy(desc(cashMovements.createdAt))
      .limit(q.limit)
      .offset((q.page - 1) * q.limit);

    const [totalResult] = await this.database.db
      .select({ total: count() })
      .from(cashMovements)
      .where(where);

    const cashInVal = Number(moves?.cashIn || 0);
    const cashOutVal = Number(moves?.cashOut || 0);

    return {
      summary: {
        cashIn: cashInVal,
        cashOut: cashOutVal,
        netCashFlow: cashInVal - cashOutVal,
        inCount: Number(moves?.inCount || 0),
        outCount: Number(moves?.outCount || 0),
        totalCount: Number(moves?.totalCount || 0),
      },
      data: rows.map((m) => ({
        id: m.id,
        shiftId: m.shiftId,
        recordedBy: m.recordedBy,
        username: m.username,
        type: m.type,
        amount: Number(m.amount) || 0,
        description: m.description || '',
        createdAt: m.createdAt,
      })),
      page: q.page,
      limit: q.limit,
      total: Number(totalResult?.total || 0),
    };
  }

  async discounts(q: ReportQueryDto) {
    const whereFilters = [
      ...this.dateFilter(q, transactions.createdAt),
      eq(transactions.status, 'COMPLETED'),
      sql`${transactions.discountAmount} > 0`,
    ];
    if (q.userId) whereFilters.push(eq(transactions.userId, q.userId));
    const where = and(...whereFilters);

    const [totals] = await this.database.db
      .select({
        totalDiscount: sql<string>`coalesce(sum(${transactions.discountAmount}), 0)`,
        totalSales: sql<string>`coalesce(sum(${transactions.totalAmount}), 0)`,
        count: count(),
      })
      .from(transactions)
      .where(where);

    const breakdown = await this.database.db
      .select({
        reason: sql<string>`coalesce(${transactions.discountReason}, 'Tanpa Alasan')`,
        count: count(),
        totalDiscount: sql<string>`coalesce(sum(${transactions.discountAmount}), 0)`,
        totalSales: sql<string>`coalesce(sum(${transactions.totalAmount}), 0)`,
      })
      .from(transactions)
      .where(where)
      .groupBy(transactions.discountReason);

    const rows = await this.database.db
      .select({
        id: transactions.id,
        transactionNumber: transactions.transactionNumber,
        userId: transactions.userId,
        cashierUsername: users.username,
        subtotalAmount: transactions.subtotalAmount,
        discountAmount: transactions.discountAmount,
        discountReason: transactions.discountReason,
        totalAmount: transactions.totalAmount,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .leftJoin(users, eq(users.id, transactions.userId))
      .where(where)
      .orderBy(desc(transactions.createdAt))
      .limit(q.limit)
      .offset((q.page - 1) * q.limit);

    const [totalCount] = await this.database.db
      .select({ total: count() })
      .from(transactions)
      .where(where);

    const totalDiscountNum = Number(totals?.totalDiscount || 0);
    const totalCountNum = Number(totals?.count || 0);

    return {
      summary: {
        totalDiscount: totalDiscountNum,
        totalSales: Number(totals?.totalSales || 0),
        discountedTransactionsCount: totalCountNum,
        averageDiscount:
          totalCountNum > 0
            ? Number((totalDiscountNum / totalCountNum).toFixed(2))
            : 0,
      },
      byReason: breakdown.map((b) => ({
        reason: b.reason,
        count: Number(b.count),
        totalDiscount: Number(b.totalDiscount),
        totalSales: Number(b.totalSales),
      })),
      transactions: {
        data: rows.map((r) => ({
          ...r,
          subtotalAmount: Number(r.subtotalAmount),
          discountAmount: Number(r.discountAmount),
          totalAmount: Number(r.totalAmount),
        })),
        page: q.page,
        limit: q.limit,
        total: Number(totalCount?.total || 0),
      },
    };
  }

  async paymentMethods(q: ReportQueryDto) {
    const whereFilters = [
      ...this.dateFilter(q, transactions.createdAt),
      eq(transactions.status, 'COMPLETED'),
    ];
    if (q.userId) whereFilters.push(eq(transactions.userId, q.userId));
    const where = and(...whereFilters);

    const [totals] = await this.database.db
      .select({
        totalRevenue: sql<string>`coalesce(sum(${transactions.totalAmount}), 0)`,
        totalCount: count(),
      })
      .from(transactions)
      .where(where);

    const methods = await this.database.db
      .select({
        paymentMethod: transactions.paymentMethod,
        revenue: sql<string>`coalesce(sum(${transactions.totalAmount}), 0)`,
        count: count(),
      })
      .from(transactions)
      .where(where)
      .groupBy(transactions.paymentMethod);

    const daily = await this.database.db
      .select({
        businessDate: sql<string>`to_char(DATE(${transactions.createdAt} at time zone 'Asia/Jakarta'), 'YYYY-MM-DD')`,
        paymentMethod: transactions.paymentMethod,
        revenue: sql<string>`coalesce(sum(${transactions.totalAmount}), 0)`,
        count: count(),
      })
      .from(transactions)
      .where(where)
      .groupBy(
        sql`DATE(${transactions.createdAt} at time zone 'Asia/Jakarta')`,
        transactions.paymentMethod,
      )
      .orderBy(
        sql`DATE(${transactions.createdAt} at time zone 'Asia/Jakarta')`,
      );

    const totalRev = Number(totals?.totalRevenue || 0);
    const totalCnt = Number(totals?.totalCount || 0);

    return {
      summary: {
        totalRevenue: totalRev,
        totalTransactions: totalCnt,
      },
      methods: methods.map((m) => {
        const rev = Number(m.revenue);
        const cnt = Number(m.count);
        return {
          paymentMethod: m.paymentMethod,
          revenue: rev,
          count: cnt,
          percentageRevenue:
            totalRev > 0 ? Number(((rev / totalRev) * 100).toFixed(2)) : 0,
          percentageCount:
            totalCnt > 0 ? Number(((cnt / totalCnt) * 100).toFixed(2)) : 0,
        };
      }),
      daily: daily.map((d) => ({
        businessDate: d.businessDate,
        paymentMethod: d.paymentMethod,
        revenue: Number(d.revenue),
        count: Number(d.count),
      })),
    };
  }

  async reconciliation(q: OverviewQueryDto) {
    const start = new Date(q.startDate);
    const end = new Date(q.endDate);
    if (/^\d{4}-\d{2}-\d{2}$/.test(q.endDate)) {
      end.setUTCDate(end.getUTCDate() + 1);
    }

    const completedInRange = and(
      gte(transactions.createdAt, start),
      lt(transactions.createdAt, end),
      eq(transactions.status, 'COMPLETED'),
    );

    // 1. Calendar day sales (00:00 WIB cut-off)
    const calendarSales = await this.database.db
      .select({
        date: sql<string>`to_char(DATE(${transactions.createdAt} at time zone 'Asia/Jakarta'), 'YYYY-MM-DD')`,
        sales: sql<string>`coalesce(sum(${transactions.totalAmount}), 0)`,
        txCount: count(),
      })
      .from(transactions)
      .where(completedInRange)
      .groupBy(
        sql`DATE(${transactions.createdAt} at time zone 'Asia/Jakarta')`,
      );

    // 2. Shift-based sales (grouped by shift openedAt in WIB)
    const shiftSales = await this.database.db
      .select({
        date: sql<string>`to_char(DATE(${shifts.openedAt} at time zone 'Asia/Jakarta'), 'YYYY-MM-DD')`,
        sales: sql<string>`coalesce(sum(${transactions.totalAmount}), 0)`,
        txCount: count(),
        shiftCount: sql<number>`count(distinct ${shifts.id})`,
      })
      .from(transactions)
      .innerJoin(shifts, eq(transactions.shiftId, shifts.id))
      .where(
        and(
          gte(shifts.openedAt, start),
          lt(shifts.openedAt, end),
          eq(transactions.status, 'COMPLETED'),
        ),
      )
      .groupBy(sql`DATE(${shifts.openedAt} at time zone 'Asia/Jakarta')`);

    const calMap = new Map(calendarSales.map((c) => [c.date, c]));
    const shiftMap = new Map(shiftSales.map((s) => [s.date, s]));

    const allDates = Array.from(
      new Set([...calMap.keys(), ...shiftMap.keys()]),
    ).sort();

    let totalCalendar = 0;
    let totalShift = 0;

    const days = allDates.map((date) => {
      const cal = calMap.get(date);
      const sh = shiftMap.get(date);
      const cSales = Number(cal?.sales || 0);
      const sSales = Number(sh?.sales || 0);
      const diff = cSales - sSales;
      totalCalendar += cSales;
      totalShift += sSales;
      return {
        date,
        calendarSales: cSales,
        calendarTxCount: Number(cal?.txCount || 0),
        shiftSales: sSales,
        shiftTxCount: Number(sh?.txCount || 0),
        shiftCount: Number(sh?.shiftCount || 0),
        difference: diff,
      };
    });

    return {
      summary: {
        totalCalendarSales: totalCalendar,
        totalShiftSales: totalShift,
        netDifference: totalCalendar - totalShift,
      },
      days,
    };
  }

  async export(
    res: Response,
    type: string,
    q: ExportQueryDto,
    _actor: AuthenticatedUser,
  ) {
    if (q.startDate && q.endDate) {
      const diffMs = Math.abs(
        new Date(q.endDate).getTime() - new Date(q.startDate).getTime(),
      );
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 92) {
        throw new BadRequestException(
          'Export date range cannot exceed 92 days',
        );
      }
    }

    const format = q.format || 'xlsx';
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `report-${type}-${q.startDate || 'all'}-${q.endDate || timestamp}`;

    const { columns, rows } = await this.getExportData(type, q);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}.csv"`,
      );

      const headerLine = columns.map((c) => this.escapeCsv(c.header)).join(',');
      res.write(headerLine + '\n');

      for (const row of rows) {
        const line = columns
          .map((col) => this.escapeCsv(row[col.key]))
          .join(',');
        res.write(line + '\n');
      }
      res.end();
    } else {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}.xlsx"`,
      );

      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: res,
        useStyles: true,
        useSharedStrings: false,
      });

      const worksheet = workbook.addWorksheet('Report');
      worksheet.columns = columns.map((c) => ({
        header: c.header,
        key: c.key,
        width: c.width || 20,
      }));

      for (const row of rows) {
        worksheet.addRow(row).commit();
      }

      worksheet.commit();
      await workbook.commit();
    }
  }

  private escapeCsv(val: any): string {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (
      str.includes(',') ||
      str.includes('"') ||
      str.includes('\n') ||
      str.includes('\r')
    ) {
      return `"${str.replaceAll('"', '""')}"`;
    }
    return str;
  }

  private async getExportData(
    type: string,
    q: ExportQueryDto,
  ): Promise<{
    columns: Array<{ header: string; key: string; width?: number }>;
    rows: Array<Record<string, any>>;
  }> {
    const reportQuery: ReportQueryDto = {
      startDate: q.startDate,
      endDate: q.endDate,
      userId: q.userId,
      paymentMethod: q.paymentMethod,
      productId: q.productId,
      categoryId: q.categoryId,
      shiftId: q.shiftId,
      status: q.status,
      type: q.cashMovementType,
      page: 1,
      limit: 10000,
    };

    switch (type) {
      case 'sales': {
        const result = await this.sales(reportQuery);
        return {
          columns: [
            { header: 'No. Transaksi', key: 'transactionNumber', width: 25 },
            { header: 'Tanggal', key: 'createdAt', width: 22 },
            { header: 'Kasir', key: 'cashierUsername', width: 18 },
            { header: 'Subtotal', key: 'subtotalAmount', width: 15 },
            { header: 'Diskon', key: 'discountAmount', width: 15 },
            { header: 'Total', key: 'totalAmount', width: 15 },
            { header: 'Metode Pembayaran', key: 'paymentMethod', width: 18 },
            { header: 'Status', key: 'status', width: 15 },
          ],
          rows: result.transactions.data,
        };
      }
      case 'products': {
        const result = await this.products(reportQuery);
        return {
          columns: [
            { header: 'Nama Produk', key: 'productName', width: 28 },
            { header: 'Kategori', key: 'categoryName', width: 20 },
            { header: 'Jumlah Terjual', key: 'quantitySold', width: 16 },
            { header: 'Total Pendapatan', key: 'totalRevenue', width: 18 },
            { header: 'Harga Rata-rata', key: 'averagePrice', width: 18 },
          ],
          rows: result.data,
        };
      }
      case 'inventory': {
        const result = await this.inventory(reportQuery);
        return {
          columns: [
            { header: 'Nama Produk', key: 'productName', width: 28 },
            { header: 'Kategori', key: 'categoryName', width: 20 },
            { header: 'Lokasi', key: 'location', width: 16 },
            { header: 'Stok', key: 'stock', width: 14 },
          ],
          rows: result.balances,
        };
      }
      case 'cash':
      case 'cash-entries': {
        const result = await this.cashEntries(reportQuery);
        return {
          columns: [
            { header: 'Tanggal', key: 'createdAt', width: 22 },
            { header: 'ID Shift', key: 'shiftId', width: 36 },
            { header: 'Dicatat Oleh', key: 'username', width: 18 },
            { header: 'Jenis', key: 'type', width: 12 },
            { header: 'Jumlah', key: 'amount', width: 16 },
            { header: 'Keterangan', key: 'description', width: 30 },
          ],
          rows: result.data,
        };
      }
      case 'shifts': {
        const result = await this.shifts(reportQuery);
        return {
          columns: [
            { header: 'ID Shift', key: 'id', width: 36 },
            { header: 'Kasir', key: 'username', width: 18 },
            { header: 'Waktu Buka', key: 'openedAt', width: 22 },
            { header: 'Waktu Tutup', key: 'closedAt', width: 22 },
            { header: 'Kas Awal', key: 'openingCash', width: 15 },
            { header: 'Kas Akhir', key: 'closingCash', width: 15 },
            { header: 'Kas Diharapkan', key: 'expectedCash', width: 15 },
            { header: 'Selisih Kas', key: 'cashDifference', width: 15 },
            { header: 'Jumlah Transaksi', key: 'transactionCount', width: 18 },
          ],
          rows: result.data,
        };
      }
      case 'cashiers': {
        const result = await this.cashierPerformance(reportQuery);
        return {
          columns: [
            { header: 'Kode Kasir', key: 'cashierCode', width: 15 },
            { header: 'Nama Kasir', key: 'cashierName', width: 20 },
            { header: 'Total Shift', key: 'totalShifts', width: 14 },
            { header: 'Total Transaksi', key: 'totalTransactions', width: 16 },
            { header: 'Total Penjualan', key: 'totalSales', width: 18 },
            { header: 'Selisih Kas', key: 'cashDifference', width: 15 },
            { header: 'Akurasi (%)', key: 'accuracyRate', width: 14 },
            { header: 'Jumlah Void', key: 'voidCount', width: 14 },
            { header: 'Status Audit', key: 'auditStatus', width: 15 },
          ],
          rows: result.cashiers.data,
        };
      }
      case 'profit': {
        const result = await this.profit({
          startDate: q.startDate,
          endDate: q.endDate,
          categoryId: q.categoryId,
          page: 1,
          limit: 10000,
        });
        return {
          columns: [
            { header: 'Nama Produk', key: 'name', width: 28 },
            { header: 'SKU', key: 'sku', width: 16 },
            { header: 'Kategori', key: 'category', width: 20 },
            { header: 'Unit Terjual', key: 'unitsSold', width: 14 },
            { header: 'Harga Jual', key: 'sellingPrice', width: 15 },
            { header: 'Harga Modal (HPP)', key: 'costPrice', width: 18 },
            { header: 'Total Pendapatan', key: 'totalRevenue', width: 18 },
            { header: 'Total HPP', key: 'totalCogs', width: 18 },
            { header: 'Laba Kotor', key: 'grossProfit', width: 18 },
            { header: 'Margin (%)', key: 'profitMargin', width: 14 },
          ],
          rows: result.products.data,
        };
      }
      case 'discounts': {
        const result = await this.discounts(reportQuery);
        return {
          columns: [
            { header: 'No. Transaksi', key: 'transactionNumber', width: 25 },
            { header: 'Tanggal', key: 'createdAt', width: 22 },
            { header: 'Kasir', key: 'cashierUsername', width: 18 },
            { header: 'Alasan Diskon', key: 'discountReason', width: 25 },
            { header: 'Jumlah Diskon', key: 'discountAmount', width: 16 },
            { header: 'Total Transaksi', key: 'totalAmount', width: 18 },
          ],
          rows: result.transactions.data,
        };
      }
      case 'payment-methods': {
        const result = await this.paymentMethods(reportQuery);
        return {
          columns: [
            { header: 'Metode Pembayaran', key: 'paymentMethod', width: 20 },
            { header: 'Jumlah Transaksi', key: 'count', width: 18 },
            { header: 'Total Pendapatan', key: 'revenue', width: 20 },
            { header: 'Pangsa Nilai (%)', key: 'percentageRevenue', width: 18 },
            { header: 'Pangsa Volume (%)', key: 'percentageCount', width: 18 },
          ],
          rows: result.methods,
        };
      }
      case 'reconciliation': {
        const result = await this.reconciliation({
          startDate: q.startDate || '2000-01-01',
          endDate: q.endDate || new Date().toISOString().slice(0, 10),
        });
        return {
          columns: [
            { header: 'Tanggal', key: 'date', width: 16 },
            {
              header: 'Penjualan Kalender (WIB)',
              key: 'calendarSales',
              width: 24,
            },
            { header: 'Tx Kalender', key: 'calendarTxCount', width: 16 },
            {
              header: 'Penjualan Shift (WIB)',
              key: 'shiftSales',
              width: 24,
            },
            { header: 'Tx Shift', key: 'shiftTxCount', width: 16 },
            { header: 'Jumlah Shift', key: 'shiftCount', width: 14 },
            { header: 'Selisih', key: 'difference', width: 16 },
          ],
          rows: result.days,
        };
      }
      default:
        throw new BadRequestException(
          `Unsupported report export type: ${type}`,
        );
    }
  }
}
