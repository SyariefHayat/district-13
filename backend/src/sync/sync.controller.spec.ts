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

import { SyncController } from './sync.controller.js';
import type { SyncService } from './sync.service.js';

describe('SyncController', () => {
  let controller: SyncController;
  let service: SyncService;

  beforeEach(() => {
    service = {
      getCatalog: vi.fn().mockResolvedValue({ products: [], categories: [] }),
      processEvents: vi.fn().mockResolvedValue({
        results: [{ seq: 1, status: 'accepted' }],
        server_time: new Date().toISOString(),
        clock_skew_seconds: 0,
      }),
    } as unknown as SyncService;

    controller = new SyncController(service);
  });

  it('delegates getCatalog to service', async () => {
    const actor = { id: 'user-1', role: 'CASHIER', sessionId: 's-1' } as any;
    const res = await controller.getCatalog({}, actor);
    expect(service.getCatalog).toHaveBeenCalledWith({}, actor);
    expect(res).toBeDefined();
  });

  it('delegates processEvents to service', async () => {
    const actor = { id: 'user-1', role: 'CASHIER', sessionId: 's-1' } as any;
    const dto = {
      events: [
        {
          seq: 1,
          type: 'sale.create' as any,
          idempotency_key: 'idem-1',
          occurred_at: new Date().toISOString(),
          payload: {},
        },
      ],
    };
    const res = await controller.processEvents(dto, actor, 'T1');
    expect(service.processEvents).toHaveBeenCalledWith(dto, actor, 'T1');
    expect(res).toBeDefined();
  });
});
