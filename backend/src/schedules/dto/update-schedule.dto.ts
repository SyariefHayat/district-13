import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import type {
  ScheduleStatusInput,
  ShiftTypeInput,
} from './create-schedule.dto.js';

export class UpdateScheduleDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsIn(['MORNING', 'AFTERNOON', 'NIGHT', 'FULLDAY'])
  shiftType?: ShiftTypeInput;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  shiftName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  startTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  endTime?: string;

  @IsOptional()
  @IsIn(['SCHEDULED', 'ON_DUTY', 'COMPLETED', 'CANCELLED'])
  status?: ScheduleStatusInput;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateScheduleStatusDto {
  @IsIn(['SCHEDULED', 'ON_DUTY', 'COMPLETED', 'CANCELLED'])
  status!: ScheduleStatusInput;
}

export class BatchDeleteSchedulesDto {
  @IsUUID('all', { each: true })
  ids!: string[];
}
