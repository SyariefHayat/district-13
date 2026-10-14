import { verify } from 'argon2';
import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
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

import { sessions, users } from '../drizzle/schema/index.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  it('creates an active account and stores an Argon2 password hash', async () => {
    const returning = vi.fn().mockResolvedValue([
      {
        id: 'user-1',
        username: 'cashier',
        role: 'CASHIER',
        isActive: true,
      },
    ]);
    const values = vi.fn().mockReturnValue({ returning });
    const database = {
      db: { insert: vi.fn(() => ({ values })) },
    };
    const service = new UsersService(database as never);

    const result = await service.create({
      username: 'cashier',
      password: 'cashier123',
      role: 'CASHIER',
    });
    const stored = values.mock.calls[0][0];

    expect(result).toMatchObject({
      username: 'cashier',
      role: 'CASHIER',
      isActive: true,
    });
    expect(stored.passwordHash).not.toBe('cashier123');
    expect(await verify(stored.passwordHash, 'cashier123')).toBe(true);
  });

  it('maps duplicate usernames to HTTP 409', async () => {
    const values = vi.fn().mockReturnValue({
      returning: async () => {
        throw Object.assign(new Error('duplicate'), { code: '23505' });
      },
    });
    const service = new UsersService({
      db: { insert: () => ({ values }) },
    } as never);

    await expect(
      service.create({
        username: 'owner',
        password: 'owner123',
        role: 'OWNER',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deactivates an account and revokes its outstanding refresh sessions atomically', async () => {
    const updateSet = vi.fn((values: unknown) => ({
      where: () => ({
        returning: async () =>
          values && 'isActive' in (values as object)
            ? [
                {
                  id: 'user-2',
                  username: 'cashier',
                  role: 'CASHIER',
                  isActive: false,
                },
              ]
            : [],
      }),
    }));
    const tx = {
      execute: vi.fn(),
      select: vi.fn(() => ({
        from: () => ({
          where: () => ({
            limit: async () => [
              {
                id: 'user-2',
                role: 'CASHIER',
                isActive: true,
              },
            ],
          }),
        }),
      })),
      update: vi.fn(() => ({ set: updateSet })),
    };
    const transaction = vi.fn((callback) => callback(tx));
    const service = new UsersService({ db: { transaction } } as never);

    const result = await service.updateStatus('user-2', false, 'owner-1');

    expect(result.isActive).toBe(false);
    expect(transaction).toHaveBeenCalledOnce();
    expect(tx.update).toHaveBeenNthCalledWith(1, users);
    expect(tx.update).toHaveBeenNthCalledWith(2, sessions);
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ revokedAt: expect.any(Date) }),
    );
  });

  it('prevents changing owner status through the cashier status endpoint', async () => {
    const tx = {
      execute: vi.fn(),
      select: vi
        .fn()
        .mockImplementationOnce(() => ({
          from: () => ({
            where: () => ({
              limit: async () => [
                {
                  id: 'owner-2',
                  role: 'OWNER',
                  isActive: true,
                },
              ],
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          from: () => ({ where: async () => [{ total: 1 }] }),
        })),
      update: vi.fn(),
    };
    const service = new UsersService({
      db: { transaction: (callback) => callback(tx) },
    } as never);

    await expect(
      service.updateStatus('owner-2', false, 'owner-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.update).not.toHaveBeenCalled();
  });

  it('prevents an owner from deleting their own account', async () => {
    const transaction = vi.fn();
    const service = new UsersService({ db: { transaction } } as never);

    await expect(service.remove('owner-1', 'owner-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(transaction).not.toHaveBeenCalled();
  });

  it('permanently deletes another account', async () => {
    const tx = {
      execute: vi.fn(),
      select: vi.fn(() => ({
        from: () => ({
          where: () => ({
            limit: async () => [
              {
                id: 'user-2',
                role: 'CASHIER',
                isActive: true,
              },
            ],
          }),
        }),
      })),
      delete: vi.fn(() => ({ where: async () => undefined })),
    };
    const service = new UsersService({
      db: { transaction: (callback) => callback(tx) },
    } as never);

    await expect(service.remove('user-2', 'owner-1')).resolves.toEqual({
      success: true,
    });
    expect(tx.delete).toHaveBeenCalledWith(users);
  });
});
