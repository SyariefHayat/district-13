import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class SetProductAddonsDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  addonIds!: string[];
}
