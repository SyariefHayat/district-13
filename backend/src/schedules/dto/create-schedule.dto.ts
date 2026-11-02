import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export type ShiftTypeInput = 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'FULLDAY';
export type ScheduleStatusInput =
  'SCHEDULED' | 'ON_DUTY' | 'COMPLETED' | 'CANCELLED';

export class CreateScheduleDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsIn(['MORNING', 'AFTERNOON', 'NIGHT', 'FULLDAY'])
  shiftType!: ShiftTypeInput;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  shiftName!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  startTime!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  endTime!: string;

  @IsOptional()
  @IsIn(['SCHEDULED', 'ON_DUTY', 'COMPLETED', 'CANCELLED'])
  status?: ScheduleStatusInput;

  @IsOptional()
  @IsString()
  notes?: string;
}
