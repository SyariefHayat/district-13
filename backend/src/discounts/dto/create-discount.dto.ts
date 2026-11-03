import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export type DiscountType = 'percentage' | 'fixed';
export type DiscountApplyMode = 'automatic' | 'manual';

export class CreateDiscountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @IsIn(['percentage', 'fixed'])
  type!: DiscountType;

  @IsOptional()
  @IsIn(['automatic', 'manual'])
  applyMode?: DiscountApplyMode;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  value!: number;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPurchase?: number | null;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxDiscount?: number | null;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  startDate?: string | null;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  endDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  @MaxLength(255)
  description?: string | null;
}
