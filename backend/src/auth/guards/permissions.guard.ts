import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  ANY_PERMISSIONS_KEY,
  AUTHENTICATED_ONLY_KEY,
  PERMISSIONS_KEY,
} from '../decorators/permissions.decorator.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import {
  PERMISSIONS,
  roleHasPermission,
  type Permission,
} from '../permissions/permissions.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler();
    const controller = context.getClass();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler,
      controller,
    ]);
    if (isPublic) return true;

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [handler, controller],
    );
    const anyPermissions = this.reflector.getAllAndOverride<Permission[]>(
      ANY_PERMISSIONS_KEY,
      [handler, controller],
    );
    const authenticatedOnly = this.reflector.getAllAndOverride<boolean>(
      AUTHENTICATED_ONLY_KEY,
      [handler, controller],
    );

    const user = context.switchToHttp().getRequest<Request>().user;
    if (!requiredPermissions?.length && !anyPermissions?.length) {
      if (authenticatedOnly && user) return true;
      throw new ForbiddenException({
        statusCode: 403,
        code: 'AUTH_FORBIDDEN',
        message: 'Forbidden resource',
      });
    }

    if (!user) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'AUTH_FORBIDDEN',
        message: 'Authentication required',
      });
    }

    const normalizedRole = user.role.toLowerCase();
    const isOwnerOrAdmin =
      normalizedRole === 'owner' || normalizedRole === 'admin';

    // Strict REQ-F-USR-006: Owner and Admin are strictly forbidden from shift opening and sales creation
    if (isOwnerOrAdmin) {
      const allPermissions = [
        ...(requiredPermissions ?? []),
        ...(anyPermissions ?? []),
      ];
      if (
        allPermissions.includes(PERMISSIONS.shiftsOpen) ||
        allPermissions.includes(PERMISSIONS.transactionsCreate)
      ) {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'AUTH_FORBIDDEN',
          message:
            'Owner and Admin are strictly prohibited from opening shifts and creating sales transactions (REQ-F-USR-006)',
        });
      }
    }

    if (
      (requiredPermissions?.some(
        (permission) => !roleHasPermission(user.role, permission),
      ) ??
        false) ||
      (anyPermissions?.length &&
        !anyPermissions.some((permission) =>
          roleHasPermission(user.role, permission),
        ))
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'AUTH_FORBIDDEN',
        message: 'Forbidden resource: missing required permission',
      });
    }
    return true;
  }
}
