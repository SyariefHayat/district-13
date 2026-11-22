import { Module } from '@nestjs/common';
import { DatabaseModule } from '../drizzle/database/database.module.js';
import { SchedulesController } from './schedules.controller.js';
import { ShiftTypesController } from './shift-types.controller.js';
import { SchedulesService } from './schedules.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [SchedulesController, ShiftTypesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
