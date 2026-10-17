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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PERMISSIONS_KEY } from '../auth/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import { UsersController } from './users.controller.js';

describe('UsersController authorization', () => {
  it('requires authentication and declares permissions for account endpoints', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, UsersController)).toEqual([
      JwtAuthGuard,
      PermissionsGuard,
    ]);
    const findAllHandler = Object.getOwnPropertyDescriptor(
      UsersController.prototype,
      'findAll',
    )?.value;
    expect(Reflect.getMetadata(PERMISSIONS_KEY, findAllHandler)).toEqual([
      PERMISSIONS.usersRead,
    ]);
  });
});
