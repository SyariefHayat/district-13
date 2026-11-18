import { hash } from 'argon2';
import { vi } from 'vitest';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';

vi.mock('../drizzle/config/env.js', () => ({
  env: {
    refreshTokenTtlSeconds: 604800,
    accessTokenSecret: 'test-only-access-token-secret-32-bytes-minimum',
  },
}));

import { AuthService } from './auth.service.js';

function loginAttemptTransaction() {
  return {
    execute: vi.fn(),
    delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
    select: vi.fn(() => ({
      from: () => ({ where: async () => [{ total: 0 }] }),
    })),
    insert: vi.fn(() => ({
      values: () => ({ returning: async () => [{ id: 'attempt-1' }] }),
    })),
  };
}

function reserveLoginAttempt(callback: (transaction: unknown) => unknown) {
  return callback(loginAttemptTransaction());
}

describe('AuthService', () => {
  it('creates a session and returns tokens for an active user with a valid password', async () => {
    const passwordHash = await hash('correct password');
    const user = {
      id: 'user-1',
      username: 'owner',
      passwordHash,
      role: 'OWNER',
      isActive: true,
      failedLoginCount: 2,
      lockedUntil: null,
    };
    const insertValues = vi.fn().mockReturnValue({
      returning: async () => [{ id: 'session-1' }],
    });
    const updateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });
    const database = {
      db: {
        select: vi.fn(() => ({
          from: () => ({ where: () => ({ limit: async () => [user] }) }),
        })),
        insert: vi.fn(() => ({ values: insertValues })),
        update: vi.fn(() => ({ set: updateSet })),
        transaction: reserveLoginAttempt,
        delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
      },
    };
    const jwtService = {
      signAsync: vi.fn().mockResolvedValue('signed-access-token'),
    };
    const service = new AuthService(database as never, jwtService as never);

    const result = await service.login(
      'owner',
      'correct password',
      '127.0.0.1',
    );

    expect(result.accessToken).toBe('signed-access-token');
    expect(result.refreshToken).toBeTruthy();
    expect(result.user).toEqual({
      id: 'user-1',
      username: 'owner',
      role: 'OWNER',
    });
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        failedLoginCount: 0,
        lockedUntil: null,
        lastActivityAt: expect.any(Date),
      }),
    );
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        expiresAt: expect.any(Date),
        refreshTokenHash: expect.not.stringContaining(result.refreshToken),
      }),
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      role: 'OWNER',
      sid: 'session-1',
    });
  });

  it('rejects unknown users with 401 AUTH_INVALID_CREDENTIALS', async () => {
    const database = {
      db: {
        select: vi.fn(() => ({
          from: () => ({
            where: () => ({ limit: async () => [] }),
          }),
        })),
        transaction: reserveLoginAttempt,
        insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) })),
      },
    };
    const service = new AuthService(
      database as never,
      { signAsync: vi.fn() } as never,
    );

    try {
      await service.login('nonexistent', 'any-pass', '127.0.0.1');
      expect.unreachable('Should have thrown UnauthorizedException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.getStatus()).toBe(401);
      expect(err.getResponse()).toMatchObject({
        statusCode: 401,
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid username or password',
      });
    }
  });

  it('increments failedLoginCount on wrong password', async () => {
    const passwordHash = await hash('correct-password');
    const user = {
      id: 'user-1',
      username: 'owner',
      passwordHash,
      role: 'OWNER',
      isActive: true,
      failedLoginCount: 2,
      lockedUntil: null,
    };
    const updateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });
    const database = {
      db: {
        select: vi.fn(() => ({
          from: () => ({
            where: () => ({ limit: async () => [user] }),
          }),
        })),
        transaction: reserveLoginAttempt,
        update: vi.fn(() => ({ set: updateSet })),
        insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) })),
      },
    };
    const service = new AuthService(
      database as never,
      { signAsync: vi.fn() } as never,
    );

    await expect(
      service.login('owner', 'wrong-pass', '127.0.0.1'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        failedLoginCount: 3,
        lockedUntil: null,
      }),
    );
  });

  it('locks account for 5 minutes after 5 consecutive failed logins', async () => {
    const passwordHash = await hash('correct-password');
    const user = {
      id: 'user-1',
      username: 'owner',
      passwordHash,
      role: 'OWNER',
      isActive: true,
      failedLoginCount: 4,
      lockedUntil: null,
    };
    const updateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });
    const database = {
      db: {
        select: vi.fn(() => ({
          from: () => ({
            where: () => ({ limit: async () => [user] }),
          }),
        })),
        transaction: reserveLoginAttempt,
        update: vi.fn(() => ({ set: updateSet })),
        insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) })),
      },
    };
    const service = new AuthService(
      database as never,
      { signAsync: vi.fn() } as never,
    );

    await expect(
      service.login('owner', 'wrong-pass', '127.0.0.1'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        failedLoginCount: 5,
        lockedUntil: expect.any(Date),
      }),
    );
  });

  it('rejects login for currently locked account with 423 AUTH_ACCOUNT_LOCKED', async () => {
    const futureLock = new Date(Date.now() + 4 * 60 * 1000);
    const user = {
      id: 'user-1',
      username: 'owner',
      passwordHash: await hash('correct-password'),
      role: 'OWNER',
      isActive: true,
      failedLoginCount: 5,
      lockedUntil: futureLock,
    };
    const database = {
      db: {
        select: vi.fn(() => ({
          from: () => ({
            where: () => ({ limit: async () => [user] }),
          }),
        })),
        transaction: reserveLoginAttempt,
        insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) })),
      },
    };
    const service = new AuthService(
      database as never,
      { signAsync: vi.fn() } as never,
    );

    try {
      await service.login('owner', 'correct-password', '127.0.0.1');
      expect.unreachable('Should have thrown HttpException 423');
    } catch (err: any) {
      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(HttpStatus.LOCKED);
      expect(err.getResponse()).toMatchObject({
        statusCode: 423,
        code: 'AUTH_ACCOUNT_LOCKED',
      });
    }
  });

  it('clears expired lockout automatically and allows successful login', async () => {
    const pastLock = new Date(Date.now() - 60 * 1000);
    const passwordHash = await hash('correct-password');
    const user = {
      id: 'user-1',
      username: 'owner',
      passwordHash,
      role: 'OWNER',
      isActive: true,
      failedLoginCount: 5,
      lockedUntil: pastLock,
    };
    const updateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });
    const database = {
      db: {
        select: vi.fn(() => ({
          from: () => ({
            where: () => ({ limit: async () => [user] }),
          }),
        })),
        transaction: reserveLoginAttempt,
        update: vi.fn(() => ({ set: updateSet })),
        insert: vi.fn(() => ({
          values: () => ({ returning: async () => [{ id: 'session-1' }] }),
        })),
        delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
      },
    };
    const service = new AuthService(
      database as never,
      { signAsync: vi.fn().mockResolvedValue('token') } as never,
    );

    const result = await service.login(
      'owner',
      'correct-password',
      '127.0.0.1',
    );
    expect(result.accessToken).toBe('token');
    // Lock clear was performed
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        failedLoginCount: 0,
        lockedUntil: null,
      }),
    );
  });

  it('rejects inactive accounts with 403 AUTH_ACCOUNT_INACTIVE', async () => {
    const user = {
      id: 'user-1',
      username: 'owner',
      passwordHash: await hash('correct-password'),
      role: 'OWNER',
      isActive: false,
      failedLoginCount: 0,
      lockedUntil: null,
    };
    const database = {
      db: {
        select: vi.fn(() => ({
          from: () => ({
            where: () => ({ limit: async () => [user] }),
          }),
        })),
        transaction: reserveLoginAttempt,
        insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) })),
      },
    };
    const service = new AuthService(
      database as never,
      { signAsync: vi.fn() } as never,
    );

    try {
      await service.login('owner', 'correct-password', '127.0.0.1');
      expect.unreachable('Should have thrown ForbiddenException 403');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ForbiddenException);
      expect(err.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(err.getResponse()).toMatchObject({
        statusCode: 403,
        code: 'AUTH_ACCOUNT_INACTIVE',
      });
    }
  });

  it('rotates a refresh token once and keeps the absolute session expiry', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const updateSet = vi.fn((values: unknown) => ({
      where: () => ({
        returning: async () => [{ id: 'session-1', expiresAt }],
      }),
      values,
    }));
    const database = {
      db: {
        select: vi
          .fn()
          .mockImplementationOnce(() => ({
            from: () => ({
              where: () => ({
                limit: async () => [
                  { id: 'session-1', userId: 'user-1', expiresAt },
                ],
              }),
            }),
          }))
          .mockImplementationOnce(() => ({
            from: () => ({
              where: () => ({
                limit: async () => [
                  {
                    id: 'user-1',
                    username: 'owner',
                    role: 'OWNER',
                    isActive: true,
                  },
                ],
              }),
            }),
          })),
        update: vi.fn(() => ({ set: updateSet })),
      },
    };
    const jwtService = {
      signAsync: vi.fn().mockResolvedValue('next-access-token'),
    };
    const service = new AuthService(database as never, jwtService as never);

    const result = await service.refresh('previous-refresh-token');

    expect(result.refreshToken).not.toBe('previous-refresh-token');
    expect(result.expiresAt).toEqual(expiresAt);
    expect(updateSet.mock.calls[0][0]).toHaveProperty('refreshTokenHash');
    expect(updateSet.mock.calls[0][0]).not.toHaveProperty('expiresAt');
  });

  it('does not return success if persisting a session fails', async () => {
    const user = {
      id: 'user-1',
      username: 'owner',
      passwordHash: await hash('secret'),
      role: 'OWNER',
      isActive: true,
      failedLoginCount: 0,
      lockedUntil: null,
    };
    const database = {
      db: {
        select: vi.fn(() => ({
          from: () => ({ where: () => ({ limit: async () => [user] }) }),
        })),
        transaction: reserveLoginAttempt,
        update: vi.fn(() => ({
          set: vi
            .fn()
            .mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
        })),
        insert: vi.fn(() => ({
          values: () => ({
            returning: async () => {
              throw new Error('database unavailable');
            },
          }),
        })),
      },
    };
    const service = new AuthService(
      database as never,
      { signAsync: vi.fn() } as never,
    );
    await expect(service.login('owner', 'secret', '127.0.0.1')).rejects.toThrow(
      'database unavailable',
    );
  });

  describe('getMe', () => {
    it('returns user profile and permissions for active cashier', async () => {
      const user = {
        id: 'user-cashier',
        username: 'kasir1',
        fullName: 'Kasir Satu',
        role: 'CASHIER',
        isActive: true,
      };
      const database = {
        db: {
          select: vi.fn(() => ({
            from: () => ({
              where: () => ({ limit: async () => [user] }),
            }),
          })),
        },
      };
      const service = new AuthService(
        database as never,
        { signAsync: vi.fn() } as never,
      );

      const me = await service.getMe('user-cashier');
      expect(me).toEqual({
        id: 'user-cashier',
        username: 'kasir1',
        fullName: 'Kasir Satu',
        role: 'CASHIER',
        permissions: expect.arrayContaining([
          'shifts.open',
          'transactions.create',
          'products.read',
        ]),
      });
      expect(me.permissions).not.toContain('users.read');
      expect(me.permissions).toHaveLength(14);
    });

    it('rejects with 401 when user is inactive or not found', async () => {
      const database = {
        db: {
          select: vi.fn(() => ({
            from: () => ({
              where: () => ({ limit: async () => [] }),
            }),
          })),
        },
      };
      const service = new AuthService(
        database as never,
        { signAsync: vi.fn() } as never,
      );

      await expect(service.getMe('missing-user')).rejects.toMatchObject({
        status: 401,
      });
    });
  });
});
