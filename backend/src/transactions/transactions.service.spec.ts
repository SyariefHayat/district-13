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
    const service = new TransactionsService({
      db: {
        transaction: (callback: (transaction: unknown) => unknown) =>
          callback(tx),
      },
    } as never);

    await expect(
      service.void('transaction-id', 'test reason', {
        id: 'owner-id',
        role: 'OWNER',
        sessionId: 'session-id',
      }),
    ).rejects.toThrow('Transactions on closed shifts cannot be voided');
    expect(tx.update).not.toHaveBeenCalled();
  });
});
