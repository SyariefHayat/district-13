import { IsDateString } from 'class-validator';

export class OverviewQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
