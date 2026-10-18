import { IsIn, IsString, Matches } from 'class-validator';

export class CreateTransactionDto {
  @IsIn(['CASH', 'QRIS'])
  paymentMethod!: 'CASH' | 'QRIS';

  @IsString()
  @Matches(/^\d{1,8}(?:\.\d{1,2})?$/)
  totalAmount!: string;
}
