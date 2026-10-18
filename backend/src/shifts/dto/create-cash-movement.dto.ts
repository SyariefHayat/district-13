import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class CreateCashMovementDto {
  @IsIn(['IN', 'OUT'])
  type!: 'IN' | 'OUT';

  @IsString()
  @Matches(/^(?=.*[1-9])\d{1,8}(?:\.\d{1,2})?$/)
  amount!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
