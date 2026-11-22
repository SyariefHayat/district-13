import { Injectable, Optional } from '@nestjs/common';
import { and, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { DatabaseService } from '../drizzle/database/database.service.js';
import {
  dailyCashierSummary,
  dailyProductSummary,
  dailySalesSummary,
  dirtyDays,
  products,
  transactionItems,
  transactions,
  users,
} from '../drizzle/schema/index.js';
import { getWibBusinessDate } from '../common/utils/formatters.js';

export interface IncrementalTransactionData {
  id: string;
  transactionNumber: string;
  userId: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'QRIS';
  createdAt: Date;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotalAmount: number;
  }>;
  isLateSync?: boolean;
}

@Injectable()
export class DailySummariesService {
  constructor(private readonly database: DatabaseService) {}

  /**
   * Updates daily summaries incrementally upon successful transaction completion.
   */
  async onTransactionCompleted(
    data: IncrementalTransactionData,
    dbTx?: any,
  ): Promise<void> {
    const db = dbTx || this.database.db;
    const businessDate = getWibBusinessDate(data.createdAt);
    const today = getWibBusinessDate(new Date());

    // 1. Mark as dirty day if synced late (past business date)
    if (data.isLateSync || businessDate < today) {
      await this.markDirty(businessDate, db);
    }

    // 2. Incremental Daily Sales Summary
    const cashTotal = data.paymentMethod === 'CASH' ? data.totalAmount : 0;
    const qrisTotal = data.paymentMethod === 'QRIS' ? data.totalAmount : 0;

    await db
      .insert(dailySalesSummary)
      .values({
        businessDate,
        revenue: data.totalAmount,
        transactionCount: 1,
        discountTotal: data.discountAmount,
        taxTotal: 0,
        paymentBreakdown: {
          CASH: cashTotal,
          QRIS: qrisTotal,
        },
      })
      .onConflictDoUpdate({
        target: [dailySalesSummary.businessDate],
        set: {
          revenue: sql`${dailySalesSummary.revenue} + ${data.totalAmount}`,
          transactionCount: sql`${dailySalesSummary.transactionCount} + 1`,
          discountTotal: sql`${dailySalesSummary.discountTotal} + ${data.discountAmount}`,
          paymentBreakdown: sql`jsonb_build_object(
            'CASH', coalesce((${dailySalesSummary.paymentBreakdown}->>'CASH')::numeric, 0) + ${cashTotal},
            'QRIS', coalesce((${dailySalesSummary.paymentBreakdown}->>'QRIS')::numeric, 0) + ${qrisTotal}
          )`,
          computedAt: new Date(),
        },
      });

    // 3. Incremental Daily Product Summary
    for (const item of data.items) {
      // Lookup product cost price
      const [prod] = await db
        .select({ costPrice: products.costPrice })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      const unitCost = Number(prod?.costPrice || 0);
      const totalItemCost = unitCost * item.quantity;

      await db
        .insert(dailyProductSummary)
        .values({
          businessDate,
          productId: item.productId,
          quantity: item.quantity,
          revenue: item.subtotalAmount,
          cost: totalItemCost,
        })
        .onConflictDoUpdate({
          target: [
            dailyProductSummary.businessDate,
            dailyProductSummary.productId,
          ],
          set: {
            quantity: sql`${dailyProductSummary.quantity} + ${item.quantity}`,
            revenue: sql`${dailyProductSummary.revenue} + ${item.subtotalAmount}`,
            cost: sql`${dailyProductSummary.cost} + ${totalItemCost}`,
          },
        });
    }

    // 4. Incremental Daily Cashier Summary
    await db
      .insert(dailyCashierSummary)
      .values({
        businessDate,
        cashierId: data.userId,
        transactionCount: 1,
        salesTotal: data.totalAmount,
        discountTotal: data.discountAmount,
        voidCount: 0,
      })
      .onConflictDoUpdate({
        target: [
          dailyCashierSummary.businessDate,
          dailyCashierSummary.cashierId,
        ],
        set: {
          transactionCount: sql`${dailyCashierSummary.transactionCount} + 1`,
          salesTotal: sql`${dailyCashierSummary.salesTotal} + ${data.totalAmount}`,
          discountTotal: sql`${dailyCashierSummary.discountTotal} + ${data.discountAmount}`,
        },
      });
  }

  /**
   * Handles voided transactions by marking dirty days and updating cashier void counters.
   */
  async onTransactionVoided(
    businessDate: string,
    cashierId: string,
    voidedAmount: number,
    dbTx?: any,
  ): Promise<void> {
    const db = dbTx || this.database.db;

    // Voiding always marks the day as dirty so it will be fully reconciled
    await this.markDirty(businessDate, db);

    // Update cashier void count
    await db
      .insert(dailyCashierSummary)
      .values({
        businessDate,
        cashierId,
        transactionCount: 0,
        salesTotal: 0,
        discountTotal: 0,
        voidCount: 1,
      })
      .onConflictDoUpdate({
        target: [
          dailyCashierSummary.businessDate,
          dailyCashierSummary.cashierId,
        ],
        set: {
          voidCount: sql`${dailyCashierSummary.voidCount} + 1`,
        },
      });
  }

  /**
   * Marks a business date as dirty for asynchronous or batch recomputation.
   */
  async markDirty(businessDate: string, dbTx?: any): Promise<void> {
    const db = dbTx || this.database.db;
    try {
      await db.insert(dirtyDays).values({ businessDate }).onConflictDoNothing();
    } catch {
      // Ignore if already marked
    }
  }

  /**
   * Fully recomputes derived summaries from critical source tables for a specific business date.
   * Completely idempotent: result rebuilt from scratch is identical to incremental aggregation.
   */
  async recomputeDate(businessDate: string): Promise<void> {
    const db = this.database.db;

    // Date range boundaries for the businessDate in WIB (UTC+7)
    // Business date starts at 00:00:00 WIB and ends at 23:59:59.999 WIB
    const startUtc = new Date(`${businessDate}T00:00:00+07:00`);
    const endUtc = new Date(`${businessDate}T23:59:59.999+07:00`);

    // 1. Compute Daily Sales Summary from COMPLETED transactions
    const [salesAgg] = await db
      .select({
        revenue: sql<number>`coalesce(sum(${transactions.totalAmount}), 0)::numeric`,
        transactionCount: sql<number>`count(*)::int`,
        discountTotal: sql<number>`coalesce(sum(${transactions.discountAmount}), 0)::numeric`,
        cashRevenue: sql<number>`coalesce(sum(case when ${transactions.paymentMethod} = 'CASH' then ${transactions.totalAmount} else 0 end), 0)::numeric`,
        qrisRevenue: sql<number>`coalesce(sum(case when ${transactions.paymentMethod} = 'QRIS' then ${transactions.totalAmount} else 0 end), 0)::numeric`,
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, startUtc),
          lt(transactions.createdAt, endUtc),
          eq(transactions.status, 'COMPLETED'),
        ),
      );

    const revenue = Number(salesAgg?.revenue || 0);
    const transactionCount = Number(salesAgg?.transactionCount || 0);
    const discountTotal = Number(salesAgg?.discountTotal || 0);
    const cashRevenue = Number(salesAgg?.cashRevenue || 0);
    const qrisRevenue = Number(salesAgg?.qrisRevenue || 0);

    await db
      .insert(dailySalesSummary)
      .values({
        businessDate,
        revenue,
        transactionCount,
        discountTotal,
        taxTotal: 0,
        paymentBreakdown: {
          CASH: cashRevenue,
          QRIS: qrisRevenue,
        },
        computedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [dailySalesSummary.businessDate],
        set: {
          revenue,
          transactionCount,
          discountTotal,
          paymentBreakdown: {
            CASH: cashRevenue,
            QRIS: qrisRevenue,
          },
          computedAt: new Date(),
        },
      });

    // 2. Compute Daily Product Summary from COMPLETED transaction items
    const productAggs = await db
      .select({
        productId: transactionItems.productId,
        quantity: sql<number>`coalesce(sum(${transactionItems.quantity}), 0)::int`,
        revenue: sql<number>`coalesce(sum(${transactionItems.subtotalAmount}), 0)::numeric`,
        cost: sql<number>`coalesce(sum(${transactionItems.quantity} * coalesce(${products.costPrice}, 0)), 0)::numeric`,
      })
      .from(transactionItems)
      .innerJoin(
        transactions,
        eq(transactionItems.transactionId, transactions.id),
      )
      .innerJoin(products, eq(transactionItems.productId, products.id))
      .where(
        and(
          gte(transactions.createdAt, startUtc),
          lt(transactions.createdAt, endUtc),
          eq(transactions.status, 'COMPLETED'),
        ),
      )
      .groupBy(transactionItems.productId);

    // Delete existing product summaries for this date and insert rebuilt values
    await db
      .delete(dailyProductSummary)
      .where(eq(dailyProductSummary.businessDate, businessDate));

    for (const p of productAggs) {
      await db.insert(dailyProductSummary).values({
        businessDate,
        productId: p.productId,
        quantity: p.quantity,
        revenue: Number(p.revenue),
        cost: Number(p.cost),
      });
    }

    // 3. Compute Daily Cashier Summary
    const cashierAggs = await db
      .select({
        cashierId: transactions.userId,
        transactionCount: sql<number>`count(case when ${transactions.status} = 'COMPLETED' then 1 end)::int`,
        salesTotal: sql<number>`coalesce(sum(case when ${transactions.status} = 'COMPLETED' then ${transactions.totalAmount} else 0 end), 0)::numeric`,
        discountTotal: sql<number>`coalesce(sum(case when ${transactions.status} = 'COMPLETED' then ${transactions.discountAmount} else 0 end), 0)::numeric`,
        voidCount: sql<number>`count(case when ${transactions.status} = 'VOIDED' then 1 end)::int`,
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, startUtc),
          lt(transactions.createdAt, endUtc),
        ),
      )
      .groupBy(transactions.userId);

    await db
      .delete(dailyCashierSummary)
      .where(eq(dailyCashierSummary.businessDate, businessDate));

    for (const c of cashierAggs) {
      await db.insert(dailyCashierSummary).values({
        businessDate,
        cashierId: c.cashierId,
        transactionCount: c.transactionCount,
        salesTotal: Number(c.salesTotal),
        discountTotal: Number(c.discountTotal),
        voidCount: c.voidCount,
      });
    }

    // 4. Remove resolved date from dirtyDays
    await db.delete(dirtyDays).where(eq(dirtyDays.businessDate, businessDate));
  }

  /**
   * Recomputes summaries for all currently marked dirty days.
   */
  async recomputeDirty(): Promise<{ recomputedDates: string[] }> {
    const marked = await this.database.db
      .select({ businessDate: dirtyDays.businessDate })
      .from(dirtyDays);

    const dates = marked.map((m) => m.businessDate);
    for (const d of dates) {
      await this.recomputeDate(d);
    }
    return { recomputedDates: dates };
  }

  /**
   * Recomputes summaries for all distinct dates found in transactions.
   */
  async recomputeAll(): Promise<{ recomputedDates: string[] }> {
    const rows = await this.database.db
      .select({
        businessDate: sql<string>`distinct to_char(${transactions.createdAt} AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD')`,
      })
      .from(transactions);

    const dates = rows.map((r) => r.businessDate).filter(Boolean);
    for (const d of dates) {
      await this.recomputeDate(d);
    }
    return { recomputedDates: dates };
  }

  /**
   * General recompute dispatcher.
   */
  async recomputeSummaries(options?: {
    date?: string;
    onlyDirty?: boolean;
    all?: boolean;
  }): Promise<{ recomputedDates: string[] }> {
    if (options?.date) {
      await this.recomputeDate(options.date);
      return { recomputedDates: [options.date] };
    }
    if (options?.all) {
      return await this.recomputeAll();
    }
    return await this.recomputeDirty();
  }
}
