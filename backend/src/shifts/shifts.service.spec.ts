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

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ShiftsService } from './shifts.service.js';

describe('ShiftsService concurrency and business rules (SHF-001..013)', () => {
  it('maps the database active-shift uniqueness violation to a conflict', async () => {
    const returning = vi.fn().mockRejectedValue({
      code: '23505',
      constraint: 'shifts_one_active_per_user',
    });
    const database = {
      db: {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([]),
            })),
          })),
        })),
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

  it('rejects opening a new shift if another cashier has an open shift (SHF-002: serah terima berurutan)', async () => {
    const database = {
      db: {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi
                .fn()
                .mockResolvedValue([
                  { id: 'first-shift-id', userId: 'first-cashier-id' },
                ]),
            })),
          })),
        })),
      },
    };
    const service = new ShiftsService(database as never);

    await expect(
      service.open(
        { openingCash: '100.00' },
        { id: 'second-cashier-id', role: 'CASHIER', sessionId: 'session-id' },
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'SHIFT_ALREADY_OPEN',
      }),
    });
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
    const insertQuery = {
      values: vi.fn().mockResolvedValue([]),
    };
    const tx = {
      select: vi
        .fn()
        .mockReturnValueOnce(lockQuery)
        .mockReturnValueOnce(totalsQuery),
      update: vi.fn(() => updateQuery),
      insert: vi.fn(() => insertQuery),
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
    // Verifies automatic closing cash withdrawal recorded (Kriteria 8)
    expect(tx.insert).toHaveBeenCalled();
  });

  it('rejects closing shift when an active cart exists', async () => {
    const service = new ShiftsService({ db: {} } as never);

    await expect(
      service.close(
        'shift-id',
        { closingCash: '50.00', hasActiveCart: true },
        { id: 'cashier-id', role: 'CASHIER', sessionId: 'session-id' },
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'ACTIVE_CART_EXISTS',
      }),
    });
  });

  it('requires supervisor reason when closing another cashier shift', async () => {
    const shift = {
      id: 'shift-id',
      userId: 'cashier-1',
      closedAt: null,
    };
    const tx = {
      select: vi.fn(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        for: vi.fn().mockResolvedValue([shift]),
      })),
    };
    const service = new ShiftsService({
      db: {
        transaction: (callback: (transaction: unknown) => unknown) =>
          callback(tx),
      },
    } as never);

    await expect(
      service.close(
        'shift-id',
        { closingCash: '50.00', reason: '' },
        { id: 'admin-id', role: 'ADMIN', sessionId: 'session-id' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('flags longOpen when shift opened >= 10 hours ago (SHF-012)', async () => {
    // 12 hours ago
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const mockShift = {
      id: 'shift-id',
      userId: 'cashier-id',
      openingCash: '50000.00',
      openedAt: twelveHoursAgo,
      closedAt: null,
      user: { id: 'cashier-id', username: 'kasir1', role: 'CASHIER' },
    };

    const database = {
      db: {
        select: vi.fn(() => ({
          from: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockShift]),
        })),
      },
    };
    const service = new ShiftsService(database as never);

    const result = await service.getCurrent({
      id: 'cashier-id',
      role: 'CASHIER',
      sessionId: 'sess-1',
    });

    expect(result).not.toBeNull();
    expect(result?.longOpen).toBe(true);
    expect(result?.durationHours).toBeGreaterThanOrEqual(12);
  });

  it('shift crossing midnight remains open and is not closed by End of Day (SHF-013)', async () => {
    // Shift opened at 22:00 yesterday
    const yesterdayLate = new Date('2026-11-19T22:00:00+07:00');
    const mockShift = {
      id: 'shift-overnight',
      userId: 'cashier-id',
      openingCash: '100000.00',
      openedAt: yesterdayLate,
      closedAt: null,
      user: { id: 'cashier-id', username: 'kasir1', role: 'CASHIER' },
    };

    const database = {
      db: {
        select: vi.fn(() => ({
          from: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockShift]),
        })),
      },
    };
    const service = new ShiftsService(database as never);

    const result = await service.getCurrent({
      id: 'cashier-id',
      role: 'CASHIER',
      sessionId: 'sess-1',
    });

    expect(result).not.toBeNull();
    expect(result?.closedAt).toBeNull();
    expect(result?.businessDate).toBe('2026-11-19');
  });

  it('requires reason for cash movement and validates ownership', async () => {
    const shift = {
      id: 'shift-id',
      userId: 'cashier-1',
      closedAt: null,
    };
    const tx = {
      select: vi.fn(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        for: vi.fn().mockResolvedValue([shift]),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi
            .fn()
            .mockResolvedValue([{ id: 'mov-1', amount: '10000' }]),
        })),
      })),
    };
    const service = new ShiftsService({
      db: {
        transaction: (callback: (transaction: unknown) => unknown) =>
          callback(tx),
      },
    } as never);

    // Empty reason should throw
    await expect(
      service.createCashMovement(
        'shift-id',
        { type: 'IN', amount: '10000.00', description: '   ' },
        { id: 'cashier-1', role: 'CASHIER', sessionId: 'sess-1' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Other cashier cannot create movement on cashier-1 shift
    await expect(
      service.createCashMovement(
        'shift-id',
        {
          type: 'IN',
          amount: '10000.00',
          description: 'Tambahan uang kembalian',
        },
        { id: 'cashier-2', role: 'CASHIER', sessionId: 'sess-2' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
