import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateCashMovementDto {
  @IsOptional()
  @IsString()
  @Matches(/^(?=.*[1-9])\d{1,8}(?:\.\d{1,2})?$/)
  amount?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Alasan mutasi kas tidak boleh kosong' })
  description?: string;
}
