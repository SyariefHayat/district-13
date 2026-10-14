import { ForbiddenException } from '@nestjs/common';
import { vi } from 'vitest';
import { RolesGuard } from './roles.guard.js';

function createContext(role?: 'OWNER' | 'ADMIN' | 'CASHIER') {
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  } as never;
}

describe('RolesGuard', () => {
  it('allows an OWNER for owner-only routes', () => {
    const reflector = { getAllAndOverride: () => ['OWNER'] };
    const guard = new RolesGuard(reflector as never);

    expect(guard.canActivate(createContext('OWNER'))).toBe(true);
  });

  it.each(['ADMIN', 'CASHIER'] as const)(
    'rejects %s with 403 for owner-only routes',
    (role) => {
      const reflector = { getAllAndOverride: () => ['OWNER'] };
      const guard = new RolesGuard(reflector as never);

      expect(() => guard.canActivate(createContext(role))).toThrow(
        ForbiddenException,
      );
    },
  );
});
