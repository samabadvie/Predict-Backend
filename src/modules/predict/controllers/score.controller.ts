import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from 'modules/auth/guards/api-key.guard';
import { ChartTimeEnum } from 'modules/market-chart/enums/chart-time.enum';
import { usernameDto } from 'modules/users/dtos/username.dto';
import { RankChartDto } from '../dtos/rank-chart.dto';
import { RankChartSchema } from '../schemas/rank-chart.schema';
import { ScoreService } from '../services/scores.service';

@ApiTags('Score Chart')
@ApiSecurity('X-Api-Key')
@UseGuards(ApiKeyAuthGuard)
@Controller('ScoreChart')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @Get('/:username')
  getScoreChart(
    @Param('') { username }: usernameDto,
    @Query() { days = ChartTimeEnum.ONEDAY }: RankChartDto,
  ): Promise<RankChartSchema> {
    return this.scoreService.getScoreChart(username, days);
  }
}
