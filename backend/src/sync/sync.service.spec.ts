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

import { SyncService } from './sync.service.js';
import { SyncEventType } from './dto/sync-events.dto.js';

describe('SyncService', () => {
  let service: SyncService;
  let mockDb: any;
  let mockInventoryService: any;

  beforeEach(() => {
    mockDb = {
      db: {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
            limit: vi.fn().mockResolvedValue([]),
            for: vi.fn().mockResolvedValue([]),
          })),
        })),
        transaction: vi.fn(async (cb) => {
          const tx = {
            insert: vi.fn(() => ({
              values: vi.fn(() => ({
                onConflictDoNothing: vi.fn(() => ({
                  returning: vi.fn().mockResolvedValue([{ id: 'key-1' }]),
                })),
              })),
            })),
            select: vi.fn(() => ({
              from: vi.fn(() => ({
                where: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue([]),
                  for: vi.fn().mockResolvedValue([]),
                })),
              })),
            })),
            update: vi.fn(() => ({
              set: vi.fn(() => ({
                where: vi.fn().mockResolvedValue([]),
              })),
            })),
          };
          return cb(tx);
        }),
      },
    };

    mockInventoryService = {
      deductForOfflineSale: vi.fn().mockResolvedValue(undefined),
      recordSaleMovements: vi.fn().mockResolvedValue(undefined),
      returnForVoid: vi.fn().mockResolvedValue(undefined),
    };

    service = new SyncService(mockDb, mockInventoryService);
  });

  it('rejects empty events array', async () => {
    const actor = { id: 'u-1', role: 'CASHIER', sessionId: 's-1' } as any;
    await expect(service.processEvents({ events: [] }, actor)).rejects.toThrow(
      'Events array cannot be empty',
    );
  });

  it('processes events and handles idempotency duplicate gracefully', async () => {
    const actor = { id: 'u-1', role: 'CASHIER', sessionId: 's-1' } as any;

    let callCount = 0;
    mockDb.db.transaction = vi.fn(async (cb) => {
      callCount++;
      const isDuplicate = callCount === 2; // second event is duplicate
      const tx = {
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            onConflictDoNothing: vi.fn(() => ({
              returning: vi
                .fn()
                .mockResolvedValue(isDuplicate ? [] : [{ id: 'key-1' }]),
            })),
          })),
        })),
        select: vi.fn(() => ({
          from: vi.fn(() => {
            const query = Object.assign(Promise.resolve([]), {
              where: vi.fn(() =>
                Object.assign(Promise.resolve([]), {
                  limit: vi.fn().mockResolvedValue([]),
                  for: vi.fn().mockResolvedValue([]),
                }),
              ),
              limit: vi.fn().mockResolvedValue([]),
              for: vi.fn().mockResolvedValue([]),
            });
            return query;
          }),
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
      };
      return cb(tx);
    });

    const dto = {
      events: [
        {
          seq: 1,
          type: SyncEventType.SHIFT_OPEN,
          idempotency_key: 'idem-1',
          occurred_at: new Date().toISOString(),
          payload: { startingCash: '100000' },
        },
        {
          seq: 2,
          type: SyncEventType.SALE_CREATE,
          idempotency_key: 'idem-duplicate',
          occurred_at: new Date().toISOString(),
          payload: { items: [{ productId: 'p-1', quantity: 1 }] },
        },
      ],
    };

    const res = await service.processEvents(dto, actor);
    expect(res.results).toEqual([
      { seq: 1, status: 'accepted' },
      { seq: 2, status: 'duplicate' },
    ]);
    expect(res.server_time).toBeDefined();
    expect(res.clock_skew_seconds).toBeGreaterThanOrEqual(0);
  });
});
