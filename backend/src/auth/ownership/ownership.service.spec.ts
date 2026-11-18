import { ForbiddenException } from '@nestjs/common';
import { vi } from 'vitest';
import { OwnershipService } from './ownership.service.js';
import type { AuthenticatedUser } from '../types/auth.types.js';

describe('OwnershipService', () => {
  const actor1: AuthenticatedUser = {
    id: 'user-1',
    role: 'cashier',
    sessionId: 'session-1',
  };

  const actor2: AuthenticatedUser = {
    id: 'user-2',
    role: 'cashier',
    sessionId: 'session-2',
  };

  it('allows access when actor is the resource owner', () => {
    const service = new OwnershipService({} as never);
    expect(() =>
      service.assertOwnership('user-1', actor1, 'shift'),
    ).not.toThrow();
  });

  it('throws ForbiddenException with AUTH_FORBIDDEN when actor does not own resource', () => {
    const service = new OwnershipService({} as never);
    try {
      service.assertOwnership('user-1', actor2, 'shift');
      expect.unreachable('Should have thrown ForbiddenException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ForbiddenException);
      expect(err.getResponse()).toMatchObject({
        statusCode: 403,
        code: 'AUTH_FORBIDDEN',
        message: expect.stringContaining('Forbidden'),
      });
    }
  });

  it('validates shift ownership from database', async () => {
    const database = {
      db: {
        select: vi.fn(() => ({
          from: () => ({
            where: () => ({ limit: async () => [{ userId: 'user-1' }] }),
          }),
        })),
      },
    };
    const service = new OwnershipService(database as never);

    await expect(
      service.assertShiftOwnership('shift-1', actor1),
    ).resolves.toBeUndefined();

    await expect(
      service.assertShiftOwnership('shift-1', actor2),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('validates transaction ownership from database', async () => {
    const database = {
      db: {
        select: vi.fn(() => ({
          from: () => ({
            where: () => ({ limit: async () => [{ userId: 'user-1' }] }),
          }),
        })),
      },
    };
    const service = new OwnershipService(database as never);

    await expect(
      service.assertTransactionOwnership('tx-1', actor1),
    ).resolves.toBeUndefined();

    await expect(
      service.assertTransactionOwnership('tx-1', actor2),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
