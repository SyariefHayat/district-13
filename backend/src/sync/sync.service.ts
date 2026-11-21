import {
  BadRequestException,
  ConflictException,
  Injectable,
  Optional,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { and, desc, eq, gte, inArray, isNull, sql } from 'drizzle-orm';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import {
  addons,
  brands,
  cashMovements,
  categories,
  discounts,
  idempotencyKeys,
  productAddons,
  products,
  shifts,
  stock,
  storeSettings,
  subcategories,
  transactionItemAddons,
  transactionItems,
  transactions,
} from '../drizzle/schema/index.js';
import { InventoryService } from '../inventory/inventory.service.js';
import type { SyncCatalogQueryDto } from './dto/sync-catalog-query.dto.js';
import {
  SyncEventType,
  type SyncEventDto,
  type SyncEventsDto,
} from './dto/sync-events.dto.js';

@Injectable()
export class SyncService {
  constructor(
    private readonly database: DatabaseService,
    private readonly inventoryService: InventoryService,
    @Optional() private readonly auditLogs?: AuditLogsService,
  ) {}

  async getCatalog(query: SyncCatalogQueryDto, actor: AuthenticatedUser) {
    const sinceDate = query.since ? new Date(query.since) : undefined;
    const isValidSince = sinceDate && !isNaN(sinceDate.getTime());

    // 1. Fetch products
    const productList = await this.database.db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        barcode: products.barcode,
        price: products.price,
        costPrice: products.costPrice,
        unit: products.unit,
        minStock: products.minStock,
        categoryId: products.categoryId,
        subcategoryId: products.subCategoryId,
        brandId: products.brandId,
        isActive: products.isActive,
      })
      .from(products);

    // 2. Fetch categories
    const categoryList = await this.database.db.select().from(categories);

    // 3. Fetch subcategories
    const subcategoryList = await this.database.db.select().from(subcategories);

    // 4. Fetch brands
    const brandList = await this.database.db.select().from(brands);

    // 5. Fetch addons
    const addonList = await this.database.db.select().from(addons);

    // 6. Fetch product addons relations
    const prodAddonList = await this.database.db.select().from(productAddons);

    // 7. Fetch active discounts
    let discountQuery = this.database.db.select().from(discounts);
    const discountList = isValidSince
      ? await discountQuery.where(gte(discounts.updatedAt, sinceDate))
      : await discountQuery;

    // 8. Fetch store settings
    const settingsList = await this.database.db.select().from(storeSettings);
    const settingsMap: Record<string, any> = {};
    for (const item of settingsList) {
      settingsMap[item.key] = item.value;
    }

    // 9. Fetch display stock
    const stockList = await this.database.db
      .select({
        productId: stock.productId,
        displayStock: stock.displayQty,
        needsReview: stock.needsReview,
      })
      .from(stock);

    const now = new Date();
    return {
      cursor: now.toISOString(),
      server_time: now.toISOString(),
      products: productList,
      categories: categoryList,
      subcategories: subcategoryList,
      brands: brandList,
      addons: addonList,
      productAddons: prodAddonList,
      discounts: discountList,
      settings: settingsMap,
      stock: stockList,
    };
  }

  async processEvents(
    dto: SyncEventsDto,
    actor: AuthenticatedUser,
    deviceCodeHeader?: string,
  ) {
    if (!dto.events || dto.events.length === 0) {
      throw new BadRequestException('Events array cannot be empty');
    }
    if (dto.events.length > 50) {
      throw new BadRequestException('Max 50 events per request');
    }

    const serverTime = new Date();
    const results: {
      seq: number;
      status: 'accepted' | 'duplicate' | 'rejected';
      error?: string;
    }[] = [];

    // Calculate maximum clock skew across events
    let maxSkewSeconds = 0;
    for (const event of dto.events) {
      const eventTime = new Date(event.occurred_at);
      if (!isNaN(eventTime.getTime())) {
        const skew = Math.abs(
          Math.round((serverTime.getTime() - eventTime.getTime()) / 1000),
        );
        if (skew > maxSkewSeconds) {
          maxSkewSeconds = skew;
        }
      }
    }

    // Process each event in its own isolated transaction
    for (const event of dto.events) {
      try {
        const result = await this.database.db.transaction(async (tx) => {
          // 1. Idempotency check
          const canonical = JSON.stringify({
            seq: event.seq,
            type: event.type,
            payload: event.payload,
          });
          const requestHash = createHash('sha256')
            .update(canonical)
            .digest('hex');

          const [insertedKey] = await tx
            .insert(idempotencyKeys)
            .values({
              userId: actor.id,
              scope: `SYNC_${event.type.toUpperCase()}`,
              key: event.idempotency_key,
              requestHash,
              responseStatus: 200,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            })
            .onConflictDoNothing()
            .returning({ id: idempotencyKeys.id });

          if (!insertedKey) {
            // Already processed!
            return 'duplicate' as const;
          }

          // 2. Dispatch event type
          await this.handleSingleEvent(tx, event, actor, serverTime);

          return 'accepted' as const;
        });

        results.push({ seq: event.seq, status: result });
      } catch (err: any) {
        results.push({
          seq: event.seq,
          status: 'rejected',
          error: err?.message || 'Unknown processing error',
        });
      }
    }

    return {
      results,
      server_time: serverTime.toISOString(),
      clock_skew_seconds: maxSkewSeconds,
    };
  }

  private async handleSingleEvent(
    tx: any,
    event: SyncEventDto,
    actor: AuthenticatedUser,
    serverTime: Date,
  ) {
    const payload = event.payload || {};

    switch (event.type) {
      case SyncEventType.SHIFT_OPEN: {
        const shiftId = payload.id || payload.shiftId || randomUUID();
        const openingCash =
          payload.openingCash || payload.startingCash || '0.00';
        const openedAt = payload.openedAt
          ? new Date(payload.openedAt)
          : new Date(event.occurred_at);

        // Check if shift already open for user or same ID
        const [existing] = await tx
          .select({ id: shifts.id })
          .from(shifts)
          .where(eq(shifts.id, shiftId));

        if (!existing) {
          await tx.insert(shifts).values({
            id: shiftId,
            userId: actor.id,
            openingCash: String(openingCash),
            openedAt,
          });

          await this.auditLogs?.record(
            {
              userId: actor.id,
              action: 'SHIFT_OPENED',
              entityType: 'SHIFT',
              entityId: shiftId,
              description: 'Shift opened (offline sync)',
              metadata: { openingCash, offlineSync: true },
            },
            tx,
          );
        }
        break;
      }

      case SyncEventType.SALE_CREATE: {
        const saleId = payload.id || randomUUID();
        const receiptNo =
          payload.receiptNo || payload.transactionNumber || `OFF-${Date.now()}`;
        const items = payload.items || [];
        const shiftId = payload.shiftId;

        // Ensure shift exists or use user's active shift
        let targetShiftId = shiftId;
        if (!targetShiftId) {
          const [activeShift] = await tx
            .select({ id: shifts.id })
            .from(shifts)
            .where(and(eq(shifts.userId, actor.id), isNull(shifts.closedAt)))
            .limit(1);
          if (activeShift) {
            targetShiftId = activeShift.id;
          } else {
            // Create a fallback shift to guarantee offline transaction safety
            const fallbackShiftId = randomUUID();
            await tx.insert(shifts).values({
              id: fallbackShiftId,
              userId: actor.id,
              openingCash: '0.00',
              openedAt: new Date(event.occurred_at),
            });
            targetShiftId = fallbackShiftId;
          }
        }

        // Deduct stock unconditionally (OFF-008: marks needsReview = true if stock < 0)
        const saleDeductions = items.map((i: any) => ({
          productId: i.productId,
          quantity: Number(i.quantity) || 1,
        }));
        if (saleDeductions.length > 0) {
          await this.inventoryService.deductForOfflineSale(tx, saleDeductions);
        }

        // Calculate totals or take snapshot
        const subtotalAmount = String(
          payload.subtotalAmount || payload.subtotal || '0.00',
        );
        const discountAmount = String(payload.discountAmount || '0.00');
        const totalAmount = String(
          payload.totalAmount || payload.total || '0.00',
        );
        const paidAmount = String(
          payload.paidAmount || payload.cashReceived || totalAmount,
        );
        const changeAmount = String(payload.changeAmount || '0.00');
        const paymentMethod = (payload.paymentMethod || 'CASH').toUpperCase();

        const createdAtClient = new Date(event.occurred_at);

        // Insert into transactions
        await tx.insert(transactions).values({
          id: saleId,
          transactionNumber: receiptNo,
          shiftId: targetShiftId,
          userId: actor.id,
          subtotalAmount,
          discountAmount,
          discountReason: payload.discountReason,
          totalAmount,
          paymentMethod,
          paidAmount,
          changeAmount,
          status: 'COMPLETED',
          createdAt: createdAtClient,
        });

        // Insert items
        for (const item of items) {
          const itemId = item.id || randomUUID();
          const quantity = Number(item.quantity) || 1;
          const unitPrice = String(item.unitPrice || item.price || '0.00');
          const itemSubtotal = String(
            item.subtotalAmount || (Number(unitPrice) * quantity).toFixed(2),
          );

          await tx.insert(transactionItems).values({
            id: itemId,
            transactionId: saleId,
            productId: item.productId,
            productName: item.productName || item.name || 'Produk',
            quantity,
            unitPrice,
            subtotalAmount: itemSubtotal,
          });

          // Add-ons
          if (Array.isArray(item.addons)) {
            for (const addon of item.addons) {
              await tx.insert(transactionItemAddons).values({
                id: randomUUID(),
                transactionItemId: itemId,
                addonId: addon.addonId || addon.id,
                addonName: addon.name || 'Addon',
                unitPrice: String(addon.price || '0.00'),
                quantity: Number(addon.quantity) || 1,
              });
            }
          }
        }

        // Record inventory movements
        if (saleDeductions.length > 0) {
          await this.inventoryService.recordSaleMovements(
            tx,
            saleDeductions,
            actor.id,
            saleId,
          );
        }

        await this.auditLogs?.record(
          {
            userId: actor.id,
            action: 'TRANSACTION_CREATED',
            entityType: 'TRANSACTION',
            entityId: saleId,
            description: `Transaction created ${receiptNo} (offline sync)`,
            metadata: { receiptNo, totalAmount, offlineSync: true },
          },
          tx,
        );
        break;
      }

      case SyncEventType.SALE_VOID: {
        const saleId = payload.transactionId || payload.saleId || payload.id;
        const reason = payload.reason || 'Offline void';

        const [sale] = await tx
          .select()
          .from(transactions)
          .where(eq(transactions.id, saleId))
          .for('update');

        if (sale && sale.status !== 'VOIDED') {
          await tx
            .update(transactions)
            .set({
              status: 'VOIDED',
              voidReason: reason,
              voidedBy: actor.id,
              voidedAt: new Date(event.occurred_at),
            })
            .where(eq(transactions.id, saleId));

          const voidItems = await tx
            .select({
              productId: transactionItems.productId,
              quantity: transactionItems.quantity,
            })
            .from(transactionItems)
            .where(eq(transactionItems.transactionId, saleId));

          if (voidItems.length > 0) {
            await this.inventoryService.returnForVoid(
              tx,
              voidItems,
              actor.id,
              saleId,
            );
          }

          await this.auditLogs?.record(
            {
              userId: actor.id,
              action: 'TRANSACTION_VOIDED',
              entityType: 'TRANSACTION',
              entityId: saleId,
              description: 'Transaction voided (offline sync)',
              metadata: { reason, offlineSync: true },
            },
            tx,
          );
        }
        break;
      }

      case SyncEventType.CASH_RECORD: {
        const shiftId = payload.shiftId;
        const type = (payload.type || 'IN').toUpperCase();
        const amount = String(payload.amount || '0.00');
        const description =
          payload.description || payload.reason || 'Offline cash entry';

        if (shiftId) {
          await tx.insert(cashMovements).values({
            id: payload.id || randomUUID(),
            shiftId,
            recordedBy: actor.id,
            type: type === 'OUT' ? 'OUT' : 'IN',
            amount,
            description,
            createdAt: new Date(event.occurred_at),
          });
        }
        break;
      }

      case SyncEventType.SHIFT_CLOSE: {
        const shiftId = payload.shiftId || payload.id;
        const closingCash = String(
          payload.closingCash || payload.actualCash || '0.00',
        );

        const [targetShift] = await tx
          .select()
          .from(shifts)
          .where(eq(shifts.id, shiftId))
          .for('update');

        if (targetShift && !targetShift.closedAt) {
          // compute expected cash from completed cash transactions + opening cash
          const [salesSummary] = await tx
            .select({
              totalCash: sql<string>`coalesce(sum(${transactions.totalAmount}), '0')`,
            })
            .from(transactions)
            .where(
              and(
                eq(transactions.shiftId, shiftId),
                eq(transactions.status, 'COMPLETED'),
                eq(transactions.paymentMethod, 'CASH'),
              ),
            );

          const expectedCashNumber =
            Number(targetShift.openingCash) +
            Number(salesSummary?.totalCash || 0);
          const difference = Number(closingCash) - expectedCashNumber;

          await tx
            .update(shifts)
            .set({
              closingCash,
              expectedCash: expectedCashNumber.toFixed(2),
              cashDifference: difference.toFixed(2),
              closedAt: new Date(event.occurred_at),
              closedBy: actor.id,
            })
            .where(eq(shifts.id, shiftId));

          await this.auditLogs?.record(
            {
              userId: actor.id,
              action: 'SHIFT_CLOSED',
              entityType: 'SHIFT',
              entityId: shiftId,
              description: 'Shift closed (offline sync)',
              metadata: { closingCash, difference, offlineSync: true },
            },
            tx,
          );
        }
        break;
      }

      default:
        throw new BadRequestException(
          `Unsupported sync event type: ${event.type}`,
        );
    }
  }
}
