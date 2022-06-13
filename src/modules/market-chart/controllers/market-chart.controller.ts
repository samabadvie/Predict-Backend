import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from 'modules/auth/guards/api-key.guard';
import { CoingeckoCoinDto } from '../dtos/coingecko-coins.dto';
import { MarketChartDto } from '../dtos/market-chart.dto';
import { MarketChartEntity } from '../entities/market-chart.entity';
import { ChartTimeEnum } from '../enums/chart-time.enum';
import { MarketChartService } from '../services/market-chart.service';

@ApiTags('Market Chart')
@ApiSecurity('X-Api-Key')
@UseGuards(ApiKeyAuthGuard)
@Controller('marketChart')
export class MarketChartController {
  constructor(private readonly marketChartService: MarketChartService) {}

  @Get(':coin')
  marketChart(
    @Param() { coin }: CoingeckoCoinDto,
    @Query() { days = ChartTimeEnum.ONEDAY }: MarketChartDto,
  ): Promise<MarketChartEntity | undefined> {
    return this.marketChartService.marketChart(coin, days);
  }
}
