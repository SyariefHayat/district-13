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

    const changeOwnPasswordHandler = Object.getOwnPropertyDescriptor(
      UsersController.prototype,
      'changeOwnPassword',
    )?.value;
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, changeOwnPasswordHandler),
    ).toEqual([PERMISSIONS.usersUpdateOwnPassword]);

    const createHandler = Object.getOwnPropertyDescriptor(
      UsersController.prototype,
      'create',
    )?.value;
    expect(Reflect.getMetadata(ANY_PERMISSIONS_KEY, createHandler)).toEqual([
      PERMISSIONS.usersCreate,
      PERMISSIONS.usersUpdateCashierCredentials,
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

    const resetPostHandler = Object.getOwnPropertyDescriptor(
      UsersController.prototype,
      'resetPasswordPost',
    )?.value;
    expect(Reflect.getMetadata(ANY_PERMISSIONS_KEY, resetPostHandler)).toEqual([
      PERMISSIONS.usersUpdateCashierCredentials,
      PERMISSIONS.usersUpdateAdminProfile,
    ]);

    const deactivateHandler = Object.getOwnPropertyDescriptor(
      UsersController.prototype,
      'deactivatePost',
    )?.value;
    expect(Reflect.getMetadata(ANY_PERMISSIONS_KEY, deactivateHandler)).toEqual(
      [
        PERMISSIONS.usersUpdateCashierCredentials,
        PERMISSIONS.usersUpdateCashierProfile,
        PERMISSIONS.usersUpdateAdminProfile,
      ],
    );

    const activateHandler = Object.getOwnPropertyDescriptor(
      UsersController.prototype,
      'activatePost',
    )?.value;
    expect(Reflect.getMetadata(ANY_PERMISSIONS_KEY, activateHandler)).toEqual([
      PERMISSIONS.usersUpdateCashierCredentials,
      PERMISSIONS.usersUpdateCashierProfile,
      PERMISSIONS.usersUpdateAdminProfile,
    ]);

    const removeHandler = Object.getOwnPropertyDescriptor(
      UsersController.prototype,
      'remove',
    )?.value;
    expect(Reflect.getMetadata(PERMISSIONS_KEY, removeHandler)).toEqual([
      PERMISSIONS.usersDelete,
    ]);
  });
});
