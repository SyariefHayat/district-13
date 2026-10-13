import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { UserRole } from './auth.types.js';

interface AccessTokenClaims {
  sub: string;
  role: UserRole;
  sid: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer '))
      throw new UnauthorizedException();

    try {
      const claims = await this.jwtService.verifyAsync<AccessTokenClaims>(
        authorization.slice(7),
      );
      if (
        typeof claims.sub !== 'string' ||
        typeof claims.sid !== 'string' ||
        !['OWNER', 'ADMIN', 'CASHIER'].includes(claims.role)
      )
        throw new UnauthorizedException();
      request.user = {
        id: claims.sub,
        role: claims.role,
        sessionId: claims.sid,
      };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
