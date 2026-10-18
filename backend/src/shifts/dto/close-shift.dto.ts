import { IsString, Matches } from 'class-validator';

export class CloseShiftDto {
  @IsString()
  @Matches(/^\d{1,8}(?:\.\d{1,2})?$/)
  closingCash!: string;
}
