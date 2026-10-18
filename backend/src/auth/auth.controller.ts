import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Post,
  Req,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { LoginDto } from './dto/login.dto.js';
import { env } from '../drizzle/config/env.js';
import { AuthService } from './auth.service.js';
import type { Request, Response } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Public } from './decorators/public.decorator.js';

const REFRESH_COOKIE = 'refresh_token';
const CSRF_COOKIE = 'csrf_token';
const REFRESH_COOKIE_PATH = '/auth';
const CSRF_COOKIE_PATH = '/';

@Controller('auth')
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(
      body.username.trim(),
      body.password,
      request.ip || 'unknown',
    );
    this.setRefreshCookie(response, result.refreshToken, result.expiresAt);
    this.clearLegacyCsrfCookie(response);
    this.setCsrfCookie(response);
    return {
      accessToken: result.accessToken,
      expiresIn: env.accessTokenTtlSeconds,
    };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertCsrfToken(request);
    const result = await this.authService.refresh(
      readCookie(request, REFRESH_COOKIE),
    );
    this.setRefreshCookie(response, result.refreshToken, result.expiresAt);
    this.clearLegacyCsrfCookie(response);
    this.setCsrfCookie(response);
    return {
      accessToken: result.accessToken,
      expiresIn: env.accessTokenTtlSeconds,
    };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertCsrfToken(request);
    await this.authService.logout(readCookie(request, REFRESH_COOKIE));
    response.clearCookie(
      REFRESH_COOKIE,
      this.cookieOptions(REFRESH_COOKIE_PATH),
    );
    response.clearCookie(CSRF_COOKIE, {
      ...this.cookieOptions(CSRF_COOKIE_PATH),
      httpOnly: false,
    });
    this.clearLegacyCsrfCookie(response);
  }

  private setRefreshCookie(response: Response, token: string, expiresAt: Date) {
    response.cookie(REFRESH_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: Math.max(0, expiresAt.getTime() - Date.now()),
      path: REFRESH_COOKIE_PATH,
    });
  }

  private cookieOptions(path = REFRESH_COOKIE_PATH) {
    return {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'lax' as const,
      path,
    };
  }

  private setCsrfCookie(response: Response) {
    response.cookie(CSRF_COOKIE, randomBytes(32).toString('base64url'), {
      ...this.cookieOptions(CSRF_COOKIE_PATH),
      httpOnly: false,
    });
  }

  private clearLegacyCsrfCookie(response: Response) {
    response.clearCookie(CSRF_COOKIE, {
      ...this.cookieOptions(REFRESH_COOKIE_PATH),
      httpOnly: false,
    });
  }

  private assertCsrfToken(request: Request) {
    const cookieToken = readCookie(request, CSRF_COOKIE);
    const headerToken = request.headers['x-csrf-token'];
    if (!cookieToken || typeof headerToken !== 'string') {
      throw new ForbiddenException('Invalid CSRF token');
    }
    const cookieBuffer = Buffer.from(cookieToken);
    const headerBuffer = Buffer.from(headerToken);
    if (
      cookieBuffer.length !== headerBuffer.length ||
      !timingSafeEqual(cookieBuffer, headerBuffer)
    ) {
      throw new ForbiddenException('Invalid CSRF token');
    }
  }
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.cookie;
  if (!header) return undefined;

  for (const entry of header.split(';')) {
    const separator = entry.indexOf('=');
    if (separator < 0 || entry.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(entry.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}
