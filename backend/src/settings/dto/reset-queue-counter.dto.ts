import { IsOptional, IsUUID } from 'class-validator';

export class ResetQueueCounterDto {
  @IsOptional()
  @IsUUID()
  deviceId?: string;
}
