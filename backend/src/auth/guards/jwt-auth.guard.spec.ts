import { UnauthorizedException } from '@nestjs/common';
import { vi } from 'vitest';

vi.mock('../../drizzle/config/env.js', () => ({
  env: {
    nodeEnv: 'test',
    databaseUrl: 'postgres://test:test@localhost:5432/test',
    accessTokenSecret: 'test-only-access-token-secret-32-bytes-minimum',
    accessTokenTtlSeconds: 900,
    refreshTokenTtlSeconds: 604800,
  },
}));

import { JwtAuthGuard } from './jwt-auth.guard.js';

function context(authorization = 'Bearer valid-access-token') {
  const request: { headers: { authorization?: string }; user?: unknown } = {
    headers: { authorization },
  };
  return {
    request,
    context: {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as never,
  };
}

describe('JwtAuthGuard', () => {
  const reflector = { getAllAndOverride: () => false };
  it('rejects a previously issued token after the user is deactivated', async () => {
    const jwtService = {
      verifyAsync: vi
        .fn()
        .mockResolvedValue({ sub: 'user-1', role: 'OWNER', sid: 'session-1' }),
    };
    const database = {
      db: {
        select: () => ({
          from: () => ({
            where: () => ({ limit: async () => [{ isActive: false }] }),
          }),
        }),
      },
    };
    const guard = new JwtAuthGuard(
      jwtService as never,
      database as never,
      reflector as never,
    );
    const requestContext = context();

    await expect(
      guard.canActivate(requestContext.context),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the authenticated user for an active account', async () => {
    const jwtService = {
      verifyAsync: vi
        .fn()
        .mockResolvedValue({
          sub: 'user-1',
          role: 'CASHIER',
          sid: 'session-1',
        }),
    };
    const database = {
      db: {
        select: () => ({
          from: () => ({
            where: () => ({ limit: async () => [{ isActive: true }] }),
          }),
        }),
      },
    };
    const guard = new JwtAuthGuard(
      jwtService as never,
      database as never,
      reflector as never,
    );
    const requestContext = context();

    await expect(guard.canActivate(requestContext.context)).resolves.toBe(true);
    expect(requestContext.request.user).toEqual({
      id: 'user-1',
      role: 'CASHIER',
      sessionId: 'session-1',
    });
  });
});
