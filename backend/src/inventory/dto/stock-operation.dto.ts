import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class StockOperationDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsEnum(['WAREHOUSE', 'DISPLAY'])
  location?: 'WAREHOUSE' | 'DISPLAY';
}
