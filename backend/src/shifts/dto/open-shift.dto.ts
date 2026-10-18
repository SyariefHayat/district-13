import { IsString, Matches } from 'class-validator';

export class OpenShiftDto {
  @IsString()
  @Matches(/^\d{1,8}(?:\.\d{1,2})?$/)
  openingCash!: string;
}
