import {
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { UserRole } from '../../auth/types/auth.types.js';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Matches(/\S/)
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(1024)
  password!: string;

  @IsIn(['OWNER', 'ADMIN', 'CASHIER'])
  role!: UserRole;
}
