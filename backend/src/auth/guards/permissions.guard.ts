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
  PERMISSIONS_KEY,
} from '../decorators/permissions.decorator.js';
import {
  roleHasPermission,
  type Permission,
} from '../permissions/permissions.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const anyPermissions = this.reflector.getAllAndOverride<Permission[]>(
      ANY_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions?.length && !anyPermissions?.length) return true;

    const user = context.switchToHttp().getRequest<Request>().user;
    if (
      !user ||
      (requiredPermissions?.some(
        (permission) => !roleHasPermission(user.role, permission),
      ) ??
        false) ||
      (anyPermissions?.length &&
        !anyPermissions.some((permission) =>
          roleHasPermission(user.role, permission),
        ))
    ) {
      throw new ForbiddenException();
    }
    return true;
  }
}
