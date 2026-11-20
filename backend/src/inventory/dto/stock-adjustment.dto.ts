import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class StockAdjustmentDto {
  @IsUUID()
  productId!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().trim() : value,
  )
  @IsIn(['WAREHOUSE', 'DISPLAY'])
  location!: 'WAREHOUSE' | 'DISPLAY';

  @IsInt()
  @Min(0)
  actualStock!: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3, {
    message: 'Adjustment reason must be at least 3 characters long',
  })
  @MaxLength(255)
  reason!: string;
}
