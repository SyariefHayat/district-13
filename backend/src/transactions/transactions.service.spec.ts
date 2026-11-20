import { createHash } from 'crypto';
import { vi } from 'vitest';

vi.mock('../drizzle/config/env.js', () => ({
  env: {
    nodeEnv: 'test',
    databaseUrl: 'postgres://test:test@localhost:5432/test',
    accessTokenSecret: 'test-only-access-token-secret-32-bytes-minimum',
    accessTokenTtlSeconds: 900,
    refreshTokenTtlSeconds: 604800,
  },
}));

import { TransactionsService } from './transactions.service.js';

describe('TransactionsService void concurrency rules', () => {
  it('locks the owning shift before marking a transaction voided', async () => {
    const shift = { id: 'shift-id', userId: 'cashier-id', closedAt: null };
    const initialQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ shiftId: shift.id }]),
    };
    const shiftLockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      for: vi.fn().mockResolvedValue([shift]),
    };
    const completedTransaction = {
      id: 'transaction-id',
      shiftId: shift.id,
      status: 'COMPLETED',
    };
    const transactionLockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      for: vi.fn().mockResolvedValue([completedTransaction]),
    };
    const itemsQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    const updateQuery = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi
        .fn()
        .mockResolvedValue([{ ...completedTransaction, status: 'VOIDED' }]),
    };
    const tx = {
      select: vi
        .fn()
        .mockReturnValueOnce(initialQuery)
        .mockReturnValueOnce(shiftLockQuery)
        .mockReturnValueOnce(transactionLockQuery)
        .mockReturnValueOnce(itemsQuery),
      update: vi.fn(() => updateQuery),
      insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
    };
    const service = new TransactionsService(
      {
        db: {
          transaction: (callback: (transaction: unknown) => unknown) =>
            callback(tx),
        },
      } as never,
      { returnForVoid: vi.fn() } as never,
    );

    await service.void('transaction-id', 'test reason', {
      id: 'owner-id',
      role: 'OWNER',
      sessionId: 'session-id',
    });

    expect(shiftLockQuery.for).toHaveBeenCalledWith('update');
    expect(transactionLockQuery.for).toHaveBeenCalledWith('update');
    expect(updateQuery.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'VOIDED', voidedBy: 'owner-id' }),
    );
  });

  it('refuses to void transactions for a closed shift', async () => {
    const initialQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ shiftId: 'shift-id' }]),
    };
    const shiftLockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      for: vi
        .fn()
        .mockResolvedValue([{ id: 'shift-id', closedAt: new Date() }]),
    };
    const tx = {
      select: vi
        .fn()
        .mockReturnValueOnce(initialQuery)
        .mockReturnValueOnce(shiftLockQuery),
      update: vi.fn(),
    };
    const service = new TransactionsService(
      {
        db: {
          transaction: (callback: (transaction: unknown) => unknown) =>
            callback(tx),
        },
      } as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.void('transaction-id', 'test reason', {
        id: 'owner-id',
        role: 'OWNER',
        sessionId: 'session-id',
      }),
    ).rejects.toThrow('Transactions on closed shifts cannot be voided');
    expect(tx.update).not.toHaveBeenCalled();
  });

  it('rejects void if reason is empty', async () => {
    const service = new TransactionsService({} as never, {} as never);
    await expect(
      service.void('transaction-id', '', {
        id: 'owner-id',
        role: 'OWNER',
        sessionId: 'session-id',
      }),
    ).rejects.toThrow('reason must be 1 to 255 characters after trimming');
  });

  it('rejects cashier voiding a transaction from another cashier shift', async () => {
    const shift = { id: 'shift-1', userId: 'cashier-other', closedAt: null };
    const initialQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ shiftId: shift.id }]),
    };
    const shiftLockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      for: vi.fn().mockResolvedValue([shift]),
    };
    const tx = {
      select: vi
        .fn()
        .mockReturnValueOnce(initialQuery)
        .mockReturnValueOnce(shiftLockQuery),
      update: vi.fn(),
    };
    const service = new TransactionsService(
      {
        db: {
          transaction: (callback: (transaction: unknown) => unknown) =>
            callback(tx),
        },
      } as never,
      {} as never,
    );

    await expect(
      service.void('transaction-id', 'Mistake', {
        id: 'cashier-me',
        role: 'CASHIER',
        sessionId: 'session-id',
      }),
    ).rejects.toThrow(
      'You can only void transactions created in your own active shift',
    );
  });
});

describe('TransactionsService create rules', () => {
  it('throws SHIFT_NOT_OPEN if user has no open shift', async () => {
    const insertKeyQuery = {
      values: vi.fn().mockReturnThis(),
      onConflictDoNothing: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'key-1' }]),
      }),
    };
    const shiftQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue({
        for: vi.fn().mockResolvedValue([]),
      }),
    };
    const tx = {
      insert: vi.fn().mockReturnValue(insertKeyQuery),
      select: vi.fn().mockReturnValue(shiftQuery),
    };
    const service = new TransactionsService(
      {
        db: {
          transaction: (callback: (transaction: unknown) => unknown) =>
            callback(tx),
        },
      } as never,
      {} as never,
    );

    await expect(
      service.create(
        {
          paymentMethod: 'CASH',
          paidAmount: '50000',
          items: [{ productId: 'prod-1', quantity: 1, addonIds: [] }],
        },
        { id: 'user-1', role: 'CASHIER', sessionId: 's-1' },
      ),
    ).rejects.toThrow('Open a shift before creating a transaction');
  });

  it('returns duplicate status when request is idempotent duplicate', async () => {
    const existingResponseBody = { id: 'tx-1', receiptNumber: 'POS-001' };
    const canonical = JSON.stringify({
      items: [{ productId: 'prod-1', quantity: 1, addonIds: [] }],
      paymentMethod: 'CASH',
      paidAmount: '50000.00',
      discountAmount: '0.00',
    });
    const requestHash = createHash('sha256').update(canonical).digest('hex');

    const insertKeyQuery = {
      values: vi.fn().mockReturnThis(),
      onConflictDoNothing: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    };
    const tx = {
      insert: vi.fn().mockReturnValue(insertKeyQuery),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 'existing-id',
              requestHash,
              responseStatus: 201,
              responseBody: existingResponseBody,
            },
          ]),
        }),
      }),
    };
    const service = new TransactionsService(
      {
        db: {
          transaction: (callback: (transaction: unknown) => unknown) =>
            callback(tx),
        },
      } as never,
      {} as never,
    );

    const result = await service.create(
      {
        paymentMethod: 'CASH',
        paidAmount: '50000',
        items: [{ productId: 'prod-1', quantity: 1, addonIds: [] }],
      },
      { id: 'user-1', role: 'CASHIER', sessionId: 's-1' },
      'idem-key-1',
    );

    expect(result).toEqual({
      ...existingResponseBody,
      status: 'duplicate',
      isDuplicate: true,
    });
  });
});
