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

import { NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';

describe('TransactionsService shift association', () => {
  it('locks the cashier active shift before inserting a transaction', async () => {
    const shift = { id: 'shift-id', userId: 'cashier-id', closedAt: null };
    const lockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      for: vi.fn().mockResolvedValue([shift]),
    };
    const transaction = { id: 'transaction-id', shiftId: shift.id };
    const returning = vi.fn().mockResolvedValue([transaction]);
    const insertQuery = {
      values: vi.fn().mockReturnValue({ returning }),
    };
    const tx = {
      select: vi.fn(() => lockQuery),
      insert: vi.fn(() => insertQuery),
    };
    const service = new TransactionsService({
      db: {
        transaction: (callback: (transaction: unknown) => unknown) =>
          callback(tx),
      },
    } as never);

    await service.create(
      { paymentMethod: 'CASH', amount: 12 },
      { id: 'cashier-id', role: 'CASHIER', sessionId: 'session-id' },
    );

    expect(lockQuery.for).toHaveBeenCalledWith('update');
    expect(insertQuery.values).toHaveBeenCalledWith(
      expect.objectContaining({ shiftId: shift.id, userId: 'cashier-id' }),
    );
  });

  it('rejects transaction creation when the caller has no active shift', async () => {
    const lockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      for: vi.fn().mockResolvedValue([]),
    };
    const tx = { select: vi.fn(() => lockQuery), insert: vi.fn() };
    const service = new TransactionsService({
      db: {
        transaction: (callback: (transaction: unknown) => unknown) =>
          callback(tx),
      },
    } as never);

    await expect(
      service.create(
        { paymentMethod: 'CASH', amount: 12 },
        { id: 'cashier-id', role: 'CASHIER', sessionId: 'session-id' },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.insert).not.toHaveBeenCalled();
  });
});
