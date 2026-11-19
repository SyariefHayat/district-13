import { IsArray, IsOptional, IsString } from 'class-validator';

export class ImportProductsDto {
  @IsOptional()
  @IsString()
  csv?: string;

  @IsOptional()
  @IsArray()
  rows?: Array<Record<string, unknown>>;
}
