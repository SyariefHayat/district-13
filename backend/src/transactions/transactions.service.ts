import { createHash } from 'node:crypto';
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
  inArray,
  isNull,
  lte,
  sql,
} from 'drizzle-orm';
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
  idempotencyKeys,
  products,
  productAddons,
  shifts,
  transactionAuditLogs,
  transactionItemAddons,
  transactionItems,
  transactions,
  users,
} from '../drizzle/schema/index.js';
import type { CreateTransactionDto } from './dto/create-transaction.dto.js';
import type { ListTransactionsDto } from './dto/list-transactions.dto.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';

type NormalizedItem = {
  productId: string;
  quantity: number;
  addonIds: string[];
};

@Injectable()
export class TransactionsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly inventoryService: InventoryService,
    @Optional() private readonly auditLogs?: AuditLogsService,
  ) {}

  async create(
    input: CreateTransactionDto,
    actor: AuthenticatedUser,
    key: string,
  ) {
    const items = normalizeItems(input.items);
    const paidCents = moneyToCents(input.paidAmount);
    const paymentMethod = input.paymentMethod;
    const canonical = JSON.stringify({
      items,
      paymentMethod,
      paidAmount: centsToMoney(paidCents),
    });
    const requestHash = createHash('sha256').update(canonical).digest('hex');

    return this.database.db.transaction(async (tx) => {
      const [insertedKey] = await tx
        .insert(idempotencyKeys)
        .values({
          userId: actor.id,
          scope: 'TRANSACTION_CREATE',
          key,
          requestHash,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        })
        .onConflictDoNothing()
        .returning({ id: idempotencyKeys.id });
      if (!insertedKey) {
        const [prior] = await tx
          .select()
          .from(idempotencyKeys)
          .where(
            and(
              eq(idempotencyKeys.userId, actor.id),
              eq(idempotencyKeys.scope, 'TRANSACTION_CREATE'),
              eq(idempotencyKeys.key, key),
            ),
          );
        if (!prior)
          throw new ConflictException(
            'Idempotency request is still processing',
          );
        if (prior.requestHash !== requestHash)
          throw new ConflictException(
            'Idempotency-Key was already used with a different request',
          );
        if (!prior.responseBody || prior.responseStatus !== 201)
          throw new ConflictException('Idempotency result is unavailable');
        return prior.responseBody;
      }

      const [shift] = await tx
        .select()
        .from(shifts)
        .where(and(eq(shifts.userId, actor.id), isNull(shifts.closedAt)))
        .for('update');
      if (!shift)
        throw new ConflictException(
          'Open a shift before creating a transaction',
        );

      const lockedProducts = new Map<string, typeof products.$inferSelect>();
      for (const item of items) {
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .for('share');
        if (!product)
          throw new NotFoundException(`Product ${item.productId} not found`);
        const [category] = await tx
          .select()
          .from(categories)
          .where(eq(categories.id, product.categoryId))
          .for('share');
        if (!product.isActive || !product.isAvailable || !category?.isActive) {
          throw new BadRequestException(
            `Product ${product.name} is not available for sale`,
          );
        }
        lockedProducts.set(product.id, product);
      }

      const lockedAddons = new Map<string, typeof addons.$inferSelect>();
      for (const addonId of [
        ...new Set(items.flatMap((item) => item.addonIds)),
      ].sort()) {
        const [addon] = await tx
          .select()
          .from(addons)
          .where(eq(addons.id, addonId))
          .for('share');
        if (!addon || !addon.isActive)
          throw new BadRequestException(
            `Add-on ${addonId} is invalid or inactive`,
          );
        lockedAddons.set(addonId, addon);
      }
      for (const item of items) {
        if (item.addonIds.length === 0) continue;
        const links = await tx
          .select({ addonId: productAddons.addonId })
          .from(productAddons)
          .where(
            and(
              eq(productAddons.productId, item.productId),
              inArray(productAddons.addonId, item.addonIds),
            ),
          )
          .for('share');
        if (links.length !== item.addonIds.length)
          throw new BadRequestException(
            'Add-on is not linked to the selected product',
          );
      }

      let subtotalCents = 0n;
      const calculated = items.map((item) => {
        const product = lockedProducts.get(item.productId)!;
        const productPrice = moneyToCents(product.price);
        const addonPrices = item.addonIds.map((id) =>
          moneyToCents(lockedAddons.get(id)!.price),
        );
        const unitCents =
          productPrice + addonPrices.reduce((sum, value) => sum + value, 0n);
        const itemCents = unitCents * BigInt(item.quantity);
        subtotalCents += itemCents;
        return { ...item, product, productPrice, itemCents };
      });
      if (subtotalCents > 9999999999n)
        throw new BadRequestException(
          'Transaction amount exceeds the supported limit',
        );
      const totalCents = subtotalCents;
      let changeCents = 0n;
      if (paymentMethod === 'CASH') {
        if (paidCents < totalCents)
          throw new BadRequestException(
            'paidAmount must cover the transaction total',
          );
        changeCents = paidCents - totalCents;
      } else if (paidCents !== totalCents) {
        throw new BadRequestException(
          'QRIS paidAmount must equal the transaction total',
        );
      }

      const sales = calculated.map(({ productId, quantity }) => ({
        productId,
        quantity,
      }));
      await this.inventoryService.deductForSale(tx, sales);

      const counterRows =
        await tx.execute(sql`INSERT INTO transaction_counters (business_date, last_value)
        VALUES ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date, 1)
        ON CONFLICT (business_date) DO UPDATE SET last_value = transaction_counters.last_value + 1
        RETURNING business_date::text AS business_date, last_value`);
      const counter = counterRows[0] as
        { business_date: string; last_value: number } | undefined;
      if (!counter)
        throw new ConflictException(
          'Transaction number could not be allocated',
        );
      const date = counter.business_date.replaceAll('-', '');
      const transactionNumber = `D13-${date}-${String(counter.last_value).padStart(4, '0')}`;
      const [transaction] = await tx
        .insert(transactions)
        .values({
          transactionNumber,
          shiftId: shift.id,
          userId: actor.id,
          subtotalAmount: centsToMoney(subtotalCents),
          discountAmount: '0.00',
          totalAmount: centsToMoney(totalCents),
          paymentMethod,
          paidAmount: centsToMoney(paidCents),
          changeAmount: centsToMoney(changeCents),
          status: 'COMPLETED',
        })
        .returning();
      if (!transaction)
        throw new ConflictException('Transaction could not be created');
      await this.auditLogs?.record(
        {
          userId: actor.id,
          action: 'TRANSACTION_CREATED',
          entityType: 'TRANSACTION',
          entityId: transaction.id,
          description: `Transaction ${transactionNumber} created`,
          metadata: { paymentMethod, totalAmount: transaction.totalAmount },
        },
        tx,
      );

      for (const item of calculated) {
        const [savedItem] = await tx
          .insert(transactionItems)
          .values({
            transactionId: transaction.id,
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: centsToMoney(item.productPrice),
            subtotalAmount: centsToMoney(item.itemCents),
          })
          .returning({ id: transactionItems.id });
        for (const addonId of item.addonIds) {
          const addon = lockedAddons.get(addonId)!;
          await tx.insert(transactionItemAddons).values({
            transactionItemId: savedItem.id,
            addonId,
            addonName: addon.name,
            unitPrice: addon.price,
            quantity: 1,
          });
        }
      }
      await this.inventoryService.recordSaleMovements(
        tx,
        sales,
        actor.id,
        transaction.id,
      );
      await tx.insert(transactionAuditLogs).values([
        {
          transactionId: transaction.id,
          userId: actor.id,
          event: 'TRANSACTION_CREATED',
        },
        {
          transactionId: transaction.id,
          userId: actor.id,
          event: 'INVENTORY_SALE_DEDUCTED',
        },
      ]);
      const response = {
        id: transaction.id,
        transactionNumber,
        subtotalAmount: centsToMoney(subtotalCents),
        discountAmount: '0.00',
        totalAmount: centsToMoney(totalCents),
        paymentMethod,
        paidAmount: centsToMoney(paidCents),
        changeAmount: centsToMoney(changeCents),
        status: 'COMPLETED',
      };
      await tx
        .update(idempotencyKeys)
        .set({
          responseStatus: 201,
          responseBody: response,
          resourceId: transaction.id,
        })
        .where(eq(idempotencyKeys.id, insertedKey.id));
      return response;
    });
  }

  async list(query: ListTransactionsDto, actor: AuthenticatedUser) {
    if (
      query.startDate &&
      query.endDate &&
      new Date(query.startDate).getTime() > new Date(query.endDate).getTime()
    ) {
      throw new BadRequestException('startDate must be before endDate');
    }
    const filters = [];
    const canReadAll = roleHasPermission(
      actor.role,
      PERMISSIONS.transactionsReadAll,
    );
    if (!canReadAll) filters.push(eq(transactions.userId, actor.id));
    else if (query.userId) filters.push(eq(transactions.userId, query.userId));
    if (query.shiftId) filters.push(eq(transactions.shiftId, query.shiftId));
    if (query.status) filters.push(eq(transactions.status, query.status));
    if (query.paymentMethod)
      filters.push(eq(transactions.paymentMethod, query.paymentMethod));
    if (query.transactionNumber)
      filters.push(eq(transactions.transactionNumber, query.transactionNumber));
    if (query.startDate)
      filters.push(gte(transactions.createdAt, new Date(query.startDate)));
    if (query.endDate)
      filters.push(lte(transactions.createdAt, endDate(query.endDate)));
    const where = filters.length ? and(...filters) : undefined;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [data, [total]] = await Promise.all([
      this.database.db
        .select()
        .from(transactions)
        .where(where)
        .orderBy(desc(transactions.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.database.db
        .select({ total: count() })
        .from(transactions)
        .where(where),
    ]);
    return { data, page, limit, total: Number(total.total) };
  }

  async get(id: string, actor: AuthenticatedUser) {
    const [transaction] = await this.database.db
      .select({
        transaction: transactions,
        cashier: users.username,
        shiftOpenedAt: shifts.openedAt,
        shiftClosedAt: shifts.closedAt,
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.userId, users.id))
      .innerJoin(shifts, eq(transactions.shiftId, shifts.id))
      .where(eq(transactions.id, id));
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (
      !roleHasPermission(actor.role, PERMISSIONS.transactionsReadAll) &&
      transaction.transaction.userId !== actor.id
    )
      throw new NotFoundException('Transaction not found');
    const items = await this.database.db
      .select()
      .from(transactionItems)
      .where(eq(transactionItems.transactionId, id));
    const addonsByItem = await Promise.all(
      items.map(async (item) => ({
        ...item,
        addons: await this.database.db
          .select()
          .from(transactionItemAddons)
          .where(eq(transactionItemAddons.transactionItemId, item.id)),
      })),
    );
    return {
      ...transaction.transaction,
      cashier: transaction.cashier,
      shift: {
        id: transaction.transaction.shiftId,
        openedAt: transaction.shiftOpenedAt,
        closedAt: transaction.shiftClosedAt,
      },
      items: addonsByItem,
    };
  }

  async void(id: string, reason: string, actor: AuthenticatedUser) {
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 1 || normalizedReason.length > 255)
      throw new BadRequestException(
        'reason must be 1 to 255 characters after trimming',
      );
    return this.database.db.transaction(async (tx) => {
      const [initial] = await tx
        .select({ shiftId: transactions.shiftId })
        .from(transactions)
        .where(eq(transactions.id, id));
      if (!initial) throw new NotFoundException('Transaction not found');
      const [shift] = await tx
        .select()
        .from(shifts)
        .where(eq(shifts.id, initial.shiftId))
        .for('update');
      if (!shift) throw new NotFoundException('Shift not found');
      if (shift.closedAt)
        throw new ConflictException(
          'Transactions on closed shifts cannot be voided',
        );
      const [transaction] = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .for('update');
      if (!transaction || transaction.status !== 'COMPLETED')
        throw new ConflictException('Transaction is already voided');
      const rows = await tx
        .select()
        .from(transactionItems)
        .where(eq(transactionItems.transactionId, id));
      const [voided] = await tx
        .update(transactions)
        .set({
          status: 'VOIDED',
          voidedBy: actor.id,
          voidedAt: new Date(),
          voidReason: normalizedReason,
        })
        .where(
          and(eq(transactions.id, id), eq(transactions.status, 'COMPLETED')),
        )
        .returning();
      if (!voided) throw new ConflictException('Transaction is already voided');
      await this.auditLogs?.record(
        {
          userId: actor.id,
          action: 'TRANSACTION_VOIDED',
          entityType: 'TRANSACTION',
          entityId: id,
          description: `Transaction ${transaction.transactionNumber} voided`,
          metadata: { reason: normalizedReason },
        },
        tx,
      );
      await this.inventoryService.returnForVoid(
        tx,
        rows.map(({ productId, quantity }) => ({ productId, quantity })),
        actor.id,
        id,
      );
      await tx.insert(transactionAuditLogs).values([
        { transactionId: id, userId: actor.id, event: 'TRANSACTION_VOIDED' },
        {
          transactionId: id,
          userId: actor.id,
          event: 'INVENTORY_VOID_RETURNED',
        },
      ]);
      return voided;
    });
  }
}

function normalizeItems(
  input: CreateTransactionDto['items'],
): NormalizedItem[] {
  const grouped = new Map<string, NormalizedItem>();
  for (const item of input) {
    const addonIds = [...item.addonIds].sort();
    const previous = grouped.get(item.productId);
    if (previous && previous.addonIds.join(',') !== addonIds.join(','))
      throw new BadRequestException(
        'Repeated products must use the same add-ons',
      );
    if (previous) {
      previous.quantity += item.quantity;
      if (previous.quantity > 2147483647)
        throw new BadRequestException(
          'Combined product quantity exceeds the supported limit',
        );
    } else
      grouped.set(item.productId, {
        productId: item.productId,
        quantity: item.quantity,
        addonIds,
      });
  }
  return [...grouped.values()].sort((a, b) =>
    a.productId.localeCompare(b.productId),
  );
}

function moneyToCents(value: string): bigint {
  const [whole, fraction = ''] = value.split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (cents < 0n || cents > 9999999999n)
    throw new BadRequestException(
      'Money amount is outside the supported range',
    );
  return cents;
}

function centsToMoney(cents: bigint): string {
  return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
}

function endDate(value: string): Date {
  const result = new Date(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) result.setUTCHours(23, 59, 59, 999);
  return result;
}
