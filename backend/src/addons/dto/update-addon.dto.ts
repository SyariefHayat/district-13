import { PartialType } from '@nestjs/mapped-types';
import { CreateAddonDto } from './create-addon.dto.js';

export class UpdateAddonDto extends PartialType(CreateAddonDto, {
  skipNullProperties: false,
}) {}
