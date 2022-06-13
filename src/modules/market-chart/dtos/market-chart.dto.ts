import { IsEnum, IsNotEmpty } from 'class-validator';
import { ChartTimeEnum } from '../enums/chart-time.enum';

export class MarketChartDto {
  @IsNotEmpty()
  @IsEnum(ChartTimeEnum)
  days?: ChartTimeEnum;
}
