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

export class ExportQueryDto {
  @IsOptional()
  @IsIn(['xlsx', 'csv'])
  format: 'xlsx' | 'csv' = 'xlsx';

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsIn(['CASH', 'QRIS'])
  paymentMethod?: 'CASH' | 'QRIS';

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @IsOptional()
  @IsIn(['OPEN', 'CLOSED'])
  status?: 'OPEN' | 'CLOSED';

  @IsOptional()
  @IsIn(['IN', 'OUT'])
  cashMovementType?: 'IN' | 'OUT';
}
