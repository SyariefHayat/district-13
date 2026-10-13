import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from '../drizzle/config/env.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { RolesGuard } from './roles.guard.js';

@Module({
  imports: [
    JwtModule.register({
      secret: env.accessTokenSecret,
      signOptions: { expiresIn: env.accessTokenTtlSeconds },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard],
  exports: [AuthGuard, RolesGuard],
})
export class AuthModule {}
