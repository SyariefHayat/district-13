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

import { PERMISSIONS_KEY } from '../auth/decorators/permissions.decorator.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import { TransactionsController } from './transactions.controller.js';

describe('TransactionsController authorization', () => {
  it('protects void operations with the declared permission', () => {
    const handler = Object.getOwnPropertyDescriptor(
      TransactionsController.prototype,
      'void',
    )?.value;
    expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).toEqual([
      PERMISSIONS.transactionsVoid,
    ]);
  });
});
