import { Transform } from 'class-transformer';
import {
  IsDecimal,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @Matches(/\S/)
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsDecimal({ decimal_digits: '0,2', force_decimal: false })
  @Matches(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/)
  price!: string;

  @IsUUID()
  categoryId!: string;
}
