import { verify } from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { env } from '../drizzle/config/env.js';
import { and, count, eq, gt, gte, isNull, lt, or, sql } from 'drizzle-orm';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import {
  authAuditLogs,
  authLoginAttempts,
  sessions,
  users,
} from '../drizzle/schema/index.js';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../drizzle/database/database.service.js';
import {
  ROLE_PERMISSIONS,
  type Permission,
} from './permissions/permissions.js';

const INVALID_CREDENTIALS = 'Invalid username or password';
const INVALID_SESSION = 'Invalid or expired session';
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT = 5;
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$Ja/8BZlIsjsqscIy/f5AXQ$Y9y0PCi7tqQRmWpwChkZQNLDed0/OhbcyKgRq+G81XA';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly database: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string, ipAddress: string) {
    const normalizedUsername = username.trim().toLowerCase();
    const usernameKey = this.rateLimitKey(normalizedUsername);
    const ipKey = this.rateLimitKey(ipAddress || 'unknown');
    const attemptId = await this.reserveLoginAttempt(usernameKey, ipKey);

    const [user] = await this.database.db
      .select({
        id: users.id,
        username: users.username,
        passwordHash: users.passwordHash,
        fullName: users.fullName,
        role: users.role,
        isActive: users.isActive,
        failedLoginCount: users.failedLoginCount,
        lockedUntil: users.lockedUntil,
      })
      .from(users)
      .where(eq(users.username, normalizedUsername))
      .limit(1);

    if (user?.lockedUntil) {
      if (new Date(user.lockedUntil) > new Date()) {
        await this.database.db.insert(authAuditLogs).values({
          userId: user.id,
          event: 'AUTH_LOGIN_LOCKED',
        });
        this.logger.warn(
          `AUTH_LOGIN_LOCKED for username: ${normalizedUsername}`,
        );
        throw new HttpException(
          {
            statusCode: HttpStatus.LOCKED,
            code: 'AUTH_ACCOUNT_LOCKED',
            message:
              'Account is temporarily locked due to consecutive failed login attempts. Please try again later.',
          },
          HttpStatus.LOCKED,
        );
      } else {
        await this.database.db
          .update(users)
          .set({ lockedUntil: null, failedLoginCount: 0 })
          .where(eq(users.id, user.id));
        user.lockedUntil = null;
        user.failedLoginCount = 0;
      }
    }

    if (user && !user.isActive) {
      await this.database.db.insert(authAuditLogs).values({
        userId: user.id,
        event: 'AUTH_LOGIN_INACTIVE',
      });
      this.logger.warn(
        `AUTH_LOGIN_INACTIVE for username: ${normalizedUsername}`,
      );
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        code: 'AUTH_ACCOUNT_INACTIVE',
        message: 'Account is inactive',
      });
    }

    let passwordIsValid = false;
    try {
      passwordIsValid = await verify(
        user?.passwordHash ?? DUMMY_PASSWORD_HASH,
        password,
      );
    } catch {
      // A malformed stored hash is treated like invalid credentials.
    }

    if (!user || !passwordIsValid) {
      if (user) {
        const nextFailed = (user.failedLoginCount ?? 0) + 1;
        const isLocking = nextFailed >= LOGIN_LIMIT;
        const lockedUntil = isLocking
          ? new Date(Date.now() + 5 * 60 * 1000)
          : null;

        await this.database.db
          .update(users)
          .set({
            failedLoginCount: nextFailed,
            lockedUntil,
          })
          .where(eq(users.id, user.id));

        await this.database.db.insert(authAuditLogs).values({
          userId: user.id,
          event: isLocking ? 'AUTH_ACCOUNT_LOCKED' : 'AUTH_LOGIN_FAILED',
        });
      } else {
        await this.database.db.insert(authAuditLogs).values({
          userId: null,
          event: 'AUTH_LOGIN_FAILED',
        });
      }
      this.logger.warn(`AUTH_LOGIN_FAILED for username: ${normalizedUsername}`);
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        code: 'AUTH_INVALID_CREDENTIALS',
        message: INVALID_CREDENTIALS,
      });
    }

    await this.database.db
      .update(users)
      .set({
        failedLoginCount: 0,
        lockedUntil: null,
        lastActivityAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await this.database.db.insert(authAuditLogs).values({
      userId: user.id,
      event: 'AUTH_LOGIN_SUCCESS',
    });

    const refreshToken = createRefreshToken();
    const expiresAt = new Date(Date.now() + env.refreshTokenTtlSeconds * 1000);
    const [session] = await this.database.db
      .insert(sessions)
      .values({
        userId: user.id,
        refreshTokenHash: hashRefreshToken(refreshToken),
        expiresAt,
      })
      .returning({ id: sessions.id });

    if (!session) throw new Error('Failed to create authentication session');
    await this.database.db
      .delete(authLoginAttempts)
      .where(eq(authLoginAttempts.id, attemptId));

    return {
      accessToken: await this.issueAccessToken(user.id, user.role, session.id),
      refreshToken,
      expiresAt,
      user: publicUser(user),
    };
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        code: 'AUTH_SESSION_EXPIRED',
        message: INVALID_SESSION,
      });
    }

    const oldHash = hashRefreshToken(refreshToken);
    const now = new Date();
    const [currentSession] = await this.database.db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.refreshTokenHash, oldHash),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, now),
        ),
      )
      .limit(1);

    if (!currentSession) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        code: 'AUTH_SESSION_EXPIRED',
        message: INVALID_SESSION,
      });
    }

    const [user] = await this.database.db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, currentSession.userId))
      .limit(1);

    if (!user?.isActive) {
      await this.revokeSession(currentSession.id);
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        code: 'AUTH_SESSION_EXPIRED',
        message: INVALID_SESSION,
      });
    }

    const nextRefreshToken = createRefreshToken();
    const [rotatedSession] = await this.database.db
      .update(sessions)
      .set({ refreshTokenHash: hashRefreshToken(nextRefreshToken) })
      .where(
        and(
          eq(sessions.id, currentSession.id),
          eq(sessions.refreshTokenHash, oldHash),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, now),
        ),
      )
      .returning({ id: sessions.id, expiresAt: sessions.expiresAt });

    // The hash predicate makes concurrent refresh requests single-use.
    if (!rotatedSession) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        code: 'AUTH_SESSION_EXPIRED',
        message: INVALID_SESSION,
      });
    }

    return {
      accessToken: await this.issueAccessToken(
        user.id,
        user.role,
        rotatedSession.id,
      ),
      refreshToken: nextRefreshToken,
      expiresAt: rotatedSession.expiresAt,
      user: publicUser(user),
    };
  }

  async getMe(userId: string) {
    const [user] = await this.database.db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        code: 'AUTH_SESSION_EXPIRED',
        message: 'User not found or inactive',
      });
    }

    const permissions =
      ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] ?? [];

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      permissions: [...permissions],
    };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;

    const [session] = await this.database.db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.refreshTokenHash, hashRefreshToken(refreshToken)))
      .limit(1);

    if (session) await this.revokeSession(session.id);
  }

  private issueAccessToken(userId: string, role: string, sessionId: string) {
    return this.jwtService.signAsync({ sub: userId, role, sid: sessionId });
  }

  private rateLimitKey(value: string): string {
    return createHmac('sha256', env.accessTokenSecret)
      .update(value)
      .digest('hex');
  }

  private async reserveLoginAttempt(
    usernameKey: string,
    ipKey: string,
  ): Promise<string> {
    const windowStart = new Date(Date.now() - LOGIN_WINDOW_MS);
    return this.database.db.transaction(async (tx) => {
      // Serialize attempts sharing either username or IP before checking the
      // limit, so concurrent requests cannot all pass the same stale count.
      for (const key of [usernameKey, ipKey].sort()) {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${key}))`);
      }

      await tx
        .delete(authLoginAttempts)
        .where(lt(authLoginAttempts.createdAt, windowStart));
      const [limits] = await tx
        .select({ total: count() })
        .from(authLoginAttempts)
        .where(
          and(
            gte(authLoginAttempts.createdAt, windowStart),
            or(
              eq(authLoginAttempts.usernameKey, usernameKey),
              eq(authLoginAttempts.ipKey, ipKey),
            ),
          ),
        );
      if (Number(limits?.total ?? 0) >= LOGIN_LIMIT) {
        throw new HttpException(
          'Too many login attempts',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const [attempt] = await tx
        .insert(authLoginAttempts)
        .values({ usernameKey, ipKey })
        .returning({ id: authLoginAttempts.id });
      if (!attempt) throw new Error('Failed to record login attempt');
      return attempt.id;
    });
  }

  private async revokeSession(sessionId: string): Promise<void> {
    await this.database.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)));
  }
}

function createRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function publicUser(user: { id: string; username: string; role: string }) {
  return { id: user.id, username: user.username, role: user.role };
}
