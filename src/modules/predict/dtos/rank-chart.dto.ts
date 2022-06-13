import { IsEnum, IsNotEmpty } from 'class-validator';
import { ChartTimeEnum } from 'modules/market-chart/enums/chart-time.enum';

export class RankChartDto {
  @IsNotEmpty()
  @IsEnum(ChartTimeEnum)
  days?: ChartTimeEnum;
}
