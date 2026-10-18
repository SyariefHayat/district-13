import { hash } from 'argon2';
import { vi } from 'vitest';

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
    };
    const insertValues = vi.fn().mockReturnValue({
      returning: async () => [{ id: 'session-1' }],
    });
    const database = {
      db: {
        select: vi.fn(() => ({
          from: () => ({ where: () => ({ limit: async () => [user] }) }),
        })),
        insert: vi.fn(() => ({ values: insertValues })),
        transaction: reserveLoginAttempt,
        delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
      },
    };
    const jwtService = {
      signAsync: vi.fn().mockResolvedValue('signed-access-token'),
    };
    const service = new AuthService(database as never, jwtService as never);

    const result = await service.login('owner', 'correct password');

    expect(result.accessToken).toBe('signed-access-token');
    expect(result.refreshToken).toBeTruthy();
    expect(result.user).toEqual({
      id: 'user-1',
      username: 'owner',
      role: 'OWNER',
    });
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

  it('rejects unknown users, incorrect passwords, and inactive accounts uniformly', async () => {
    const cases = [
      [],
      [
        {
          id: 'user-1',
          username: 'owner',
          passwordHash: await hash('different'),
          role: 'OWNER',
          isActive: true,
        },
      ],
      [
        {
          id: 'user-1',
          username: 'owner',
          passwordHash: await hash('correct'),
          role: 'OWNER',
          isActive: false,
        },
      ],
    ];

    for (const result of cases) {
      const database = {
        db: {
          select: vi.fn(() => ({
            from: () => ({
              where: () => ({ limit: async () => result }),
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
      await expect(service.login('owner', 'correct')).rejects.toMatchObject({
        status: 401,
        message: 'Invalid username or password',
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
    };
    const database = {
      db: {
        select: vi.fn(() => ({
          from: () => ({ where: () => ({ limit: async () => [user] }) }),
        })),
        transaction: reserveLoginAttempt,
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
    await expect(service.login('owner', 'secret')).rejects.toThrow(
      'database unavailable',
    );
  });
});
