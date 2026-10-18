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

import { ConflictException } from '@nestjs/common';
import { ShiftsService } from './shifts.service.js';

describe('ShiftsService concurrency rules', () => {
  it('maps the database active-shift uniqueness violation to a conflict', async () => {
    const returning = vi.fn().mockRejectedValue({ code: '23505' });
    const database = {
      db: {
        insert: vi.fn(() => ({ values: vi.fn(() => ({ returning })) })),
      },
    };
    const service = new ShiftsService(database as never);

    await expect(
      service.open(
        { openingCash: '50.00' },
        { id: 'cashier-id', role: 'CASHIER', sessionId: 'session-id' },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('locks the shift row while calculating and persisting closing figures', async () => {
    const shift = {
      id: 'shift-id',
      userId: 'cashier-id',
      openingCash: '50.00',
      closedAt: null,
    };
    const closeResult = { ...shift, closedAt: new Date() };
    const lockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      for: vi.fn().mockResolvedValue([shift]),
    };
    const totalsQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ expectedCash: '50.00' }]),
    };
    const updateQuery = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([closeResult]),
    };
    const tx = {
      select: vi
        .fn()
        .mockReturnValueOnce(lockQuery)
        .mockReturnValueOnce(totalsQuery),
      update: vi.fn(() => updateQuery),
    };
    const service = new ShiftsService({
      db: {
        transaction: (callback: (transaction: unknown) => unknown) =>
          callback(tx),
      },
    } as never);

    await service.close(
      'shift-id',
      { closingCash: '50.00' },
      { id: 'cashier-id', role: 'CASHIER', sessionId: 'session-id' },
    );

    expect(lockQuery.for).toHaveBeenCalledWith('update');
  });
});
