import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketChartController } from './controllers/market-chart.controller';
import { MarketChartEntity } from './entities/market-chart.entity';
import { MarketChartService } from './services/market-chart.service';

@Module({
  imports: [TypeOrmModule.forFeature([MarketChartEntity], 'mysql')],
  controllers: [MarketChartController],
  providers: [MarketChartService],
  exports: [MarketChartService],
})
export class MarketChartModule {}
