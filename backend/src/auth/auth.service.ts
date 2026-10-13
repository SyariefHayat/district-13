import { verify } from 'argon2';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { env } from '../drizzle/config/env.js';
import { sessions, users } from '../drizzle/schema/index.js';

const INVALID_CREDENTIALS = 'Invalid username or password';
const INVALID_SESSION = 'Invalid or expired session';

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const [user] = await this.database.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    let passwordIsValid = false;
    if (user) {
      try {
        passwordIsValid = await verify(user.passwordHash, password);
      } catch {
        // A malformed stored hash is treated like invalid credentials.
      }
    }

    if (!user || !user.isActive || !passwordIsValid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

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

    return {
      accessToken: await this.issueAccessToken(user.id, user.role, session.id),
      refreshToken,
      expiresAt,
      user: publicUser(user),
    };
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) throw new UnauthorizedException(INVALID_SESSION);

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

    if (!currentSession) throw new UnauthorizedException(INVALID_SESSION);

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
      throw new UnauthorizedException(INVALID_SESSION);
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
    if (!rotatedSession) throw new UnauthorizedException(INVALID_SESSION);

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
