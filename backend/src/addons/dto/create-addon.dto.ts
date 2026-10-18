import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDecimal,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateAddonDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/\S/)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsDecimal({ decimal_digits: '0,2', force_decimal: false })
  @Matches(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/)
  price!: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;
}
