import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class VoidTransactionDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  cashRefund?: number;
}
