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
  ANY_PERMISSIONS_KEY,
  PERMISSIONS_KEY,
} from '../auth/decorators/permissions.decorator.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import { UsersController } from './users.controller.js';

describe('UsersController authorization', () => {
  it('declares permissions for account endpoints', () => {
    const findAllHandler = Object.getOwnPropertyDescriptor(
      UsersController.prototype,
      'findAll',
    )?.value;
    expect(Reflect.getMetadata(PERMISSIONS_KEY, findAllHandler)).toEqual([
      PERMISSIONS.usersRead,
    ]);
    const updateHandler = Object.getOwnPropertyDescriptor(
      UsersController.prototype,
      'update',
    )?.value;
    expect(Reflect.getMetadata(ANY_PERMISSIONS_KEY, updateHandler)).toEqual([
      PERMISSIONS.usersUpdateOwnPassword,
      PERMISSIONS.usersUpdateAdminProfile,
      PERMISSIONS.usersUpdateCashierProfile,
      PERMISSIONS.usersUpdateCashierCredentials,
    ]);
  });
});
