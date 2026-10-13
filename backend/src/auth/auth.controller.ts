import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../drizzle/config/env.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';

const REFRESH_COOKIE = 'refresh_token';
const CSRF_COOKIE = 'csrf_token';
const AUTH_COOKIE_PATH = '/auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(
      body.username.trim(),
      body.password,
    );
    this.setRefreshCookie(response, result.refreshToken, result.expiresAt);
    this.setCsrfCookie(response);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertCsrfToken(request);
    const result = await this.authService.refresh(
      readCookie(request, REFRESH_COOKIE),
    );
    this.setRefreshCookie(response, result.refreshToken, result.expiresAt);
    this.setCsrfCookie(response);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertCsrfToken(request);
    await this.authService.logout(readCookie(request, REFRESH_COOKIE));
    response.clearCookie(REFRESH_COOKIE, this.cookieOptions());
    response.clearCookie(CSRF_COOKIE, this.cookieOptions());
    return { success: true };
  }

  private setRefreshCookie(response: Response, token: string, expiresAt: Date) {
    response.cookie(REFRESH_COOKIE, token, {
      ...this.cookieOptions(),
      expires: expiresAt,
    });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'lax' as const,
      path: AUTH_COOKIE_PATH,
    };
  }

  private setCsrfCookie(response: Response) {
    response.cookie(CSRF_COOKIE, randomBytes(32).toString('base64url'), {
      ...this.cookieOptions(),
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
