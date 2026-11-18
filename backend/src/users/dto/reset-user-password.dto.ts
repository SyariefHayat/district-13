import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetUserPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(1024)
  password!: string;
}
