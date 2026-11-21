import { IsOptional, IsString } from 'class-validator';

export class SyncCatalogQueryDto {
  @IsOptional()
  @IsString()
  since?: string;
}
