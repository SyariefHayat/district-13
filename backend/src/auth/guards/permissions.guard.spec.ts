import { ForbiddenException } from '@nestjs/common';
import {
  ANY_PERMISSIONS_KEY,
  AUTHENTICATED_ONLY_KEY,
  PERMISSIONS_KEY,
} from '../decorators/permissions.decorator.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { PERMISSIONS } from '../permissions/permissions.js';
import { PermissionsGuard } from './permissions.guard.js';

function createGuard(metadata: Record<string, unknown>, role?: string) {
  const reflector = {
    getAllAndOverride: (key: string) => metadata[key],
  };
  const guard = new PermissionsGuard(reflector as never);
  const executionContext = {
    getHandler: () => 'handler',
    getClass: () => 'controller',
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  } as never;
  return { guard, executionContext };
}

describe('PermissionsGuard', () => {
  it('requires all permissions declared by @Permissions', () => {
    const { guard, executionContext } = createGuard(
      {
        [PERMISSIONS_KEY]: [
          PERMISSIONS.productsCreate,
          PERMISSIONS.productsUpdatePrices,
        ],
      },
      'ADMIN',
    );
    expect(() => guard.canActivate(executionContext)).toThrow(
      ForbiddenException,
    );
  });

  it('accepts any permission declared by @AnyPermissions', () => {
    const { guard, executionContext } = createGuard(
      {
        [ANY_PERMISSIONS_KEY]: [
          PERMISSIONS.transactionsReadOwn,
          PERMISSIONS.transactionsReadAll,
        ],
      },
      'CASHIER',
    );
    expect(guard.canActivate(executionContext)).toBe(true);
  });

  it('denies authenticated routes without authorization metadata by default', () => {
    const { guard, executionContext } = createGuard({}, 'OWNER');
    expect(() => guard.canActivate(executionContext)).toThrow(
      ForbiddenException,
    );
  });

  it('allows explicitly authenticated-only routes only after authentication', () => {
    const authorized = createGuard(
      { [AUTHENTICATED_ONLY_KEY]: true },
      'CASHIER',
    );
    expect(authorized.guard.canActivate(authorized.executionContext)).toBe(
      true,
    );

    const anonymous = createGuard({ [AUTHENTICATED_ONLY_KEY]: true });
    expect(() =>
      anonymous.guard.canActivate(anonymous.executionContext),
    ).toThrow(ForbiddenException);
  });

  it('allows explicitly public routes without a user', () => {
    const { guard, executionContext } = createGuard({ [IS_PUBLIC_KEY]: true });
    expect(guard.canActivate(executionContext)).toBe(true);
  });

  describe('REQ-F-USR-006: Owner and Admin shift and transaction prohibitions', () => {
    it('strictly forbids Owner and Admin from opening shifts', () => {
      for (const role of ['OWNER', 'ADMIN', 'owner', 'admin']) {
        const { guard, executionContext } = createGuard(
          { [PERMISSIONS_KEY]: [PERMISSIONS.shiftsOpen] },
          role,
        );
        try {
          guard.canActivate(executionContext);
          expect.unreachable(`Role ${role} should have been forbidden`);
        } catch (err: any) {
          expect(err).toBeInstanceOf(ForbiddenException);
          expect(err.getResponse()).toMatchObject({
            statusCode: 403,
            code: 'AUTH_FORBIDDEN',
            message: expect.stringContaining('REQ-F-USR-006'),
          });
        }
      }
    });

    it('strictly forbids Owner and Admin from creating sales transactions', () => {
      for (const role of ['OWNER', 'ADMIN', 'owner', 'admin']) {
        const { guard, executionContext } = createGuard(
          { [PERMISSIONS_KEY]: [PERMISSIONS.transactionsCreate] },
          role,
        );
        try {
          guard.canActivate(executionContext);
          expect.unreachable(`Role ${role} should have been forbidden`);
        } catch (err: any) {
          expect(err).toBeInstanceOf(ForbiddenException);
          expect(err.getResponse()).toMatchObject({
            statusCode: 403,
            code: 'AUTH_FORBIDDEN',
            message: expect.stringContaining('REQ-F-USR-006'),
          });
        }
      }
    });

    it('allows Cashier to open shifts and create sales transactions', () => {
      const shiftGuard = createGuard(
        { [PERMISSIONS_KEY]: [PERMISSIONS.shiftsOpen] },
        'CASHIER',
      );
      expect(shiftGuard.guard.canActivate(shiftGuard.executionContext)).toBe(
        true,
      );

      const saleGuard = createGuard(
        { [PERMISSIONS_KEY]: [PERMISSIONS.transactionsCreate] },
        'cashier',
      );
      expect(saleGuard.guard.canActivate(saleGuard.executionContext)).toBe(
        true,
      );
    });
  });
});
