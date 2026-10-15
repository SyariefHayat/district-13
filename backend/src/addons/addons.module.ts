import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AddonsService } from './addons.service.js';
import { AddonsController } from './addons.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [AddonsController],
  providers: [AddonsService],
})
export class AddonsModule {}
