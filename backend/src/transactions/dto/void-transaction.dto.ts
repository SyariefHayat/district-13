import { IsString, Length } from 'class-validator';

export class VoidTransactionDto {
  @IsString()
  @Length(1, 255)
  reason!: string;
}
