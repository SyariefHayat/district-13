import { vi } from 'vitest';

vi.mock('../drizzle/config/env.js', () => ({
  env: { nodeEnv: 'test', accessTokenTtlSeconds: 900 },
}));

import { AuthController } from './auth.controller.js';

describe('AuthController', () => {
  it('sets the refresh token as an HttpOnly cookie and omits it from the response', async () => {
    const authService = {
      login: vi.fn().mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresAt: new Date('2026-01-01T00:00:00Z'),
        user: { id: 'user-1', username: 'owner', role: 'OWNER' },
      }),
    };
    const response = { cookie: vi.fn(), clearCookie: vi.fn() };
    const controller = new AuthController(authService as never);

    const result = await controller.login(
      { username: ' owner ', password: 'secret' },
      { ip: '127.0.0.1' } as never,
      response as never,
    );

    expect(authService.login).toHaveBeenCalledWith(
      'owner',
      'secret',
      '127.0.0.1',
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh',
      expect.objectContaining({ httpOnly: true, path: '/auth' }),
    );
    expect(result).toEqual({ accessToken: 'access', expiresIn: 900 });
  });

  it('clears the cookie when logging out', async () => {
    const authService = { logout: vi.fn().mockResolvedValue(undefined) };
    const response = { clearCookie: vi.fn() };
    const controller = new AuthController(authService as never);

    await expect(
      controller.logout(
        {
          headers: {
            cookie: 'refresh_token=old; csrf_token=csrf-value',
            'x-csrf-token': 'csrf-value',
          },
        } as never,
        response as never,
      ),
    ).resolves.toBeUndefined();
    expect(authService.logout).toHaveBeenCalledWith('old');
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.any(Object),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'csrf_token',
      expect.any(Object),
    );
  });
});
