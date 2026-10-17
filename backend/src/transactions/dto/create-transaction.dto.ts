import { IsIn, IsNumber, Max, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsIn(['CASH', 'QRIS'])
  paymentMethod!: 'CASH' | 'QRIS';

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999999.99)
  amount!: number;
}
