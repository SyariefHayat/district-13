import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, ValidateIf } from 'class-validator';
import { CreateProductDto } from './create-product.dto.js';

export class UpdateProductDto extends PartialType(CreateProductDto, {
  skipNullProperties: false,
}) {
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isAvailable?: boolean;
}
