import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum SyncEventType {
  SHIFT_OPEN = 'shift.open',
  SALE_CREATE = 'sale.create',
  SALE_VOID = 'sale.void',
  CASH_RECORD = 'cash.record',
  SHIFT_CLOSE = 'shift.close',
}

export class SyncEventDto {
  @IsNumber()
  seq!: number;

  @IsEnum(SyncEventType)
  type!: SyncEventType;

  @IsString()
  @IsNotEmpty()
  idempotency_key!: string;

  @IsString()
  @IsNotEmpty()
  occurred_at!: string;

  @IsObject()
  payload!: Record<string, any>;
}

export class SyncEventsDto {
  @IsString()
  @IsOptional()
  device_code?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SyncEventDto)
  events!: SyncEventDto[];
}
