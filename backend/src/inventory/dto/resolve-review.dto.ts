import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ResolveReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetDisplayStock?: number;
}
