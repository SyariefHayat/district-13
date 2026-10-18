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
});
