import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { Request } from 'express';
import { DatabaseService } from '../../drizzle/database/database.service.js';
import { sessions, users } from '../../drizzle/schema/index.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { UserRole } from '../types/auth.types.js';

interface AccessTokenClaims {
  sub: string;
  role?: UserRole;
  sid: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly database: DatabaseService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer '))
      throw new UnauthorizedException();

    let claims: AccessTokenClaims;
    try {
      claims = await this.jwtService.verifyAsync<AccessTokenClaims>(
        authorization.slice(7),
        { algorithms: ['HS256'] },
      );
    } catch {
      throw new UnauthorizedException();
    }

    if (typeof claims.sub !== 'string' || typeof claims.sid !== 'string')
      throw new UnauthorizedException();

    const [identity] = await this.database.db
      .select({
        isActive: users.isActive,
        role: users.role,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(
          eq(sessions.id, claims.sid),
          eq(sessions.userId, claims.sub),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (!identity?.isActive) throw new UnauthorizedException();

    request.user = {
      id: claims.sub,
      role: identity.role as UserRole,
      sessionId: claims.sid,
    };
    return true;
  }
}
