import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import type { UserRole } from '../../auth/types/auth.types.js';

export class UpdateUserDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Matches(/\S/)
  username?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MinLength(8)
  @MaxLength(1024)
  password?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsIn(['OWNER', 'ADMIN', 'CASHIER'])
  role?: UserRole;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;
}
