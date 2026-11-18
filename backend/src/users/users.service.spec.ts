import { hash, verify } from 'argon2';
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

  it('allows Admin to create Cashier, but forbids Admin from creating Owner or Admin (REQ-F-USR-002, B-03)', async () => {
    const returning = vi.fn().mockResolvedValue([
      {
        id: 'cashier-1',
        username: 'cashier_ok',
        role: 'CASHIER',
        isActive: true,
      },
    ]);
    const values = vi.fn().mockReturnValue({ returning });
    const database = {
      db: { insert: vi.fn(() => ({ values })) },
    };
    const auditLogs = { record: vi.fn().mockResolvedValue([]) };
    const service = new UsersService(database as never, auditLogs as never);

    const adminActor = {
      id: 'admin-1',
      username: 'admin',
      role: 'ADMIN' as const,
      isActive: true,
    };

    // Creating Cashier succeeds
    const created = await service.create(
      {
        username: 'cashier_ok',
        password: 'password123',
        role: 'CASHIER',
      },
      adminActor,
    );
    expect(created.role).toBe('CASHIER');
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_CREATED',
        userId: 'admin-1',
      }),
      expect.anything(),
    );

    // Creating Admin fails with ForbiddenException
    await expect(
      service.create(
        {
          username: 'admin_evil',
          password: 'password123',
          role: 'ADMIN',
        },
        adminActor,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    // Creating Owner fails with ForbiddenException
    await expect(
      service.create(
        {
          username: 'owner_evil',
          password: 'password123',
          role: 'OWNER',
        },
        adminActor,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
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
                username: 'cashier',
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
      select: vi.fn().mockImplementationOnce(() => ({
        from: () => ({
          where: () => ({
            limit: async () => [
              {
                id: 'owner-2',
                username: 'owner2',
                role: 'OWNER',
                isActive: true,
              },
            ],
          }),
        }),
      })),
      update: vi.fn(),
    };
    const service = new UsersService({
      db: {
        transaction: (callback: (trx: unknown) => unknown) => callback(tx),
      },
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

  it('forbids Admin from updating Admin or Owner accounts (AC: Admin mencoba mengubah akun Admin/Pemilik -> FORBIDDEN)', async () => {
    const tx = {
      execute: vi.fn(),
      select: vi.fn(() => ({
        from: () => ({
          where: () => ({
            limit: async () => [
              {
                id: 'admin-target',
                username: 'admin2',
                role: 'ADMIN',
                isActive: true,
              },
            ],
          }),
        }),
      })),
    };
    const service = new UsersService({
      db: { transaction: (cb: any) => cb(tx) },
    } as never);

    const adminActor = {
      id: 'admin-1',
      username: 'admin',
      role: 'ADMIN' as const,
      isActive: true,
    };

    await expect(
      service.update('admin-target', adminActor, { username: 'newname' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forbids Admin from escalating cashier role to Admin or Owner', async () => {
    const tx = {
      execute: vi.fn(),
      select: vi.fn(() => ({
        from: () => ({
          where: () => ({
            limit: async () => [
              {
                id: 'cashier-target',
                username: 'cashier1',
                role: 'CASHIER',
                isActive: true,
              },
            ],
          }),
        }),
      })),
    };
    const service = new UsersService({
      db: { transaction: (cb: any) => cb(tx) },
    } as never);

    const adminActor = {
      id: 'admin-1',
      username: 'admin',
      role: 'ADMIN' as const,
      isActive: true,
    };

    await expect(
      service.update('cashier-target', adminActor, { role: 'ADMIN' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows Admin to reset cashier password, but rejects Admin resetting Admin or Owner password', async () => {
    const tx = {
      execute: vi.fn(),
      select: vi
        .fn()
        .mockImplementationOnce(() => ({
          from: () => ({
            where: () => ({
              limit: async () => [
                {
                  id: 'cashier-1',
                  username: 'cashier1',
                  role: 'CASHIER',
                },
              ],
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          from: () => ({
            where: () => ({
              limit: async () => [
                {
                  id: 'owner-1',
                  username: 'owner1',
                  role: 'OWNER',
                },
              ],
            }),
          }),
        })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: async () => [
              {
                id: 'cashier-1',
                username: 'cashier1',
                role: 'CASHIER',
                isActive: true,
                updatedAt: new Date(),
              },
            ],
          })),
        })),
      })),
    };
    const auditLogs = { record: vi.fn().mockResolvedValue([]) };
    const service = new UsersService(
      { db: { transaction: (cb: any) => cb(tx) } } as never,
      auditLogs as never,
    );

    const adminActor = {
      id: 'admin-1',
      username: 'admin',
      role: 'ADMIN' as const,
      isActive: true,
    };

    // Resetting cashier succeeds
    const res = await service.resetPassword(
      'cashier-1',
      'newpassword123',
      adminActor,
    );
    expect(res.id).toBe('cashier-1');
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_PASSWORD_RESET',
        entityId: 'cashier-1',
      }),
      expect.anything(),
    );

    // Resetting owner fails
    await expect(
      service.resetPassword('owner-1', 'newpassword123', adminActor),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('handles changeOwnPassword (REQ-F-USR-005): forbids Cashier, validates current password, and updates hash', async () => {
    const passwordHash = await hash('oldPassword123');
    const tx = {
      execute: vi.fn(),
      select: vi.fn(() => ({
        from: () => ({
          where: () => ({
            limit: async () => [
              {
                id: 'admin-1',
                username: 'admin1',
                passwordHash,
                role: 'ADMIN',
              },
            ],
          }),
        }),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: async () => undefined,
        })),
      })),
    };
    const auditLogs = { record: vi.fn().mockResolvedValue([]) };
    const service = new UsersService(
      { db: { transaction: (cb: any) => cb(tx) } } as never,
      auditLogs as never,
    );

    const cashierActor = {
      id: 'cashier-1',
      username: 'cashier',
      role: 'CASHIER' as const,
      isActive: true,
    };
    const adminActor = {
      id: 'admin-1',
      username: 'admin1',
      role: 'ADMIN' as const,
      isActive: true,
    };

    // Cashier cannot call changeOwnPassword
    await expect(
      service.changeOwnPassword(cashierActor, {
        currentPassword: 'any',
        newPassword: 'newPassword123',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    // Admin with wrong current password fails with BadRequestException
    await expect(
      service.changeOwnPassword(adminActor, {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Admin with correct password succeeds
    const success = await service.changeOwnPassword(adminActor, {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    });
    expect(success).toMatchObject({ success: true });
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_PASSWORD_RESET',
        entityId: 'admin-1',
      }),
      expect.anything(),
    );
  });

  it('forbids non-owner from deleting user accounts', async () => {
    const adminActor = {
      id: 'admin-1',
      username: 'admin',
      role: 'ADMIN' as const,
      isActive: true,
    };
    const service = new UsersService({} as never);

    await expect(
      service.remove('cashier-1', adminActor),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('permanently deletes another account when without relations', async () => {
    const tx = {
      execute: vi.fn(),
      select: vi.fn(() => ({
        from: () => ({
          where: () => ({
            limit: async () => [
              {
                id: 'user-2',
                username: 'cashier',
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
      db: {
        transaction: (callback: (trx: unknown) => unknown) => callback(tx),
      },
    } as never);

    await expect(service.remove('user-2', 'owner-1')).resolves.toEqual({
      success: true,
    });
    expect(tx.delete).toHaveBeenCalledWith(users);
  });
});
