import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ListTransactionsDto {
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsIn(['COMPLETED', 'VOIDED']) status?: 'COMPLETED' | 'VOIDED';
  @IsOptional() @IsIn(['CASH', 'QRIS']) paymentMethod?: 'CASH' | 'QRIS';
  @IsOptional() @IsUUID() userId?: string;
  @IsOptional() @IsUUID() shiftId?: string;
  @IsOptional() @IsString() transactionNumber?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}
