import { APP_GUARD } from '@nestjs/core';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from './auth/guards/permissions.guard.js';
import { DatabaseService } from './drizzle/database/database.service.js';

describe('application authorization guards', () => {
  it('registers authentication before default-deny permission checks globally', () => {
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      AppModule,
    ) as Array<{ provide?: unknown; useExisting?: unknown }>;
    const guards = providers.filter(
      (provider) => provider.provide === APP_GUARD,
    );

    expect(guards.map((guard) => guard.useExisting)).toEqual([
      JwtAuthGuard,
      PermissionsGuard,
    ]);
  });

  it('allows public routes and returns 401 for protected routes without a token', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useValue({ db: {} })
      .compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).get('/').expect(200);
    await request(app.getHttpServer()).get('/users').expect(401);

    await app.close();
  });
});
