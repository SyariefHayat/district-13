import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class CloseShiftDto {
  @IsString()
  @Matches(/^\d{1,8}(?:\.\d{1,2})?$/)
  closingCash!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  hasActiveCart?: boolean;
}
