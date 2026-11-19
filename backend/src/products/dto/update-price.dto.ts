import { IsDecimal, IsString, Matches } from 'class-validator';

export class UpdatePriceDto {
  @IsString()
  @IsDecimal({ decimal_digits: '0,2', force_decimal: false })
  @Matches(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/)
  price!: string;
}
