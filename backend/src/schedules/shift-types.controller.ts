import { Controller, Get } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import { AnyPermissions } from '../auth/decorators/permissions.decorator.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { shiftTypes } from '../drizzle/schema/index.js';

export interface ShiftTypeResponse {
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  crossesMidnight: boolean;
}

export const DEFAULT_SHIFT_TYPES: ShiftTypeResponse[] = [
  {
    code: 'S1',
    name: 'Shift 1 Pagi',
    startTime: '07:00:00',
    endTime: '16:00:00',
    durationMinutes: 540,
    crossesMidnight: false,
  },
  {
    code: 'S2',
    name: 'Shift 2 Sore',
    startTime: '15:00:00',
    endTime: '24:00:00',
    durationMinutes: 540,
    crossesMidnight: false,
  },
  {
    code: 'S3',
    name: 'Shift 3 Malam',
    startTime: '23:00:00',
    endTime: '08:00:00',
    durationMinutes: 540,
    crossesMidnight: true,
  },
];

@Controller('shift-types')
export class ShiftTypesController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  @AnyPermissions(PERMISSIONS.schedulesReadAll, PERMISSIONS.schedulesReadOwn)
  async findAll(): Promise<ShiftTypeResponse[]> {
    try {
      const rows = await this.database.db
        .select()
        .from(shiftTypes)
        .orderBy(asc(shiftTypes.code));

      if (rows && rows.length > 0) {
        return rows.map((r) => {
          const [hStr, mStr] = r.startTime.split(':');
          const startMinutes =
            (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0);
          const totalEndMinutes = (startMinutes + r.durationMinutes) % 1440;
          const endHour = Math.floor(totalEndMinutes / 60);
          const endMinute = totalEndMinutes % 60;
          const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`;
          const crossesMidnight = startMinutes + r.durationMinutes >= 1440;

          return {
            code: r.code,
            name: r.name,
            startTime: r.startTime,
            endTime,
            durationMinutes: r.durationMinutes,
            crossesMidnight,
          };
        });
      }
    } catch {
      // Fallback to patent shift types if database table is not available
    }

    return DEFAULT_SHIFT_TYPES;
  }
}
