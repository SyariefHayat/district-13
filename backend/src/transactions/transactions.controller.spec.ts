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

import { GUARDS_METADATA } from '@nestjs/common/constants';
import { PERMISSIONS_KEY } from '../auth/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import { TransactionsController } from './transactions.controller.js';

describe('TransactionsController authorization', () => {
  it('protects void operations with owner/admin permission', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, TransactionsController),
    ).toEqual([JwtAuthGuard, PermissionsGuard]);

    const handler = Object.getOwnPropertyDescriptor(
      TransactionsController.prototype,
      'void',
    )?.value;
    expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).toEqual([
      PERMISSIONS.transactionsVoid,
    ]);
  });
});
