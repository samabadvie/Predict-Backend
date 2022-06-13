import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { CoinGeckoResponse } from '../interfaces/response.interface';
import CoinGecko from 'coingecko-api';
import { Repository } from 'typeorm';
import { MarketChartEntity } from '../entities/market-chart.entity';

@Injectable()
export class MarketChartService {
  constructor(
    @InjectRepository(MarketChartEntity, 'mysql')
    private readonly marketChartRepository: Repository<MarketChartEntity>,
  ) {}

  private readonly coinGeckoClient = new CoinGecko();

  coingeckoInputs = [
    { id: 'bitcoin', days: '1' },
    { id: 'cardano', days: '1' },
    { id: 'binancecoin', days: '1' },
    { id: 'dogecoin', days: '1' },
    { id: 'ethereum', days: '1' },
    { id: 'litecoin', days: '1' },
    { id: 'terra-luna', days: '1' },
    { id: 'solana', days: '1' },
    { id: 'polkadot', days: '1' },
    { id: 'ripple', days: '1' },
    { id: 'bitcoin', days: '7' },
    { id: 'cardano', days: '7' },
    { id: 'binancecoin', days: '7' },
    { id: 'dogecoin', days: '7' },
    { id: 'ethereum', days: '7' },
    { id: 'litecoin', days: '7' },
    { id: 'terra-luna', days: '7' },
    { id: 'solana', days: '7' },
    { id: 'polkadot', days: '7' },
    { id: 'ripple', days: '7' },
    { id: 'bitcoin', days: '30' },
    { id: 'cardano', days: '30' },
    { id: 'binancecoin', days: '30' },
    { id: 'dogecoin', days: '30' },
    { id: 'ethereum', days: '30' },
    { id: 'litecoin', days: '30' },
    { id: 'terra-luna', days: '30' },
    { id: 'solana', days: '30' },
    { id: 'polkadot', days: '30' },
    { id: 'ripple', days: '30' },
    { id: 'bitcoin', days: '90' },
    { id: 'cardano', days: '90' },
    { id: 'binancecoin', days: '90' },
    { id: 'dogecoin', days: '90' },
    { id: 'ethereum', days: '90' },
    { id: 'litecoin', days: '90' },
    { id: 'terra-luna', days: '90' },
    { id: 'solana', days: '90' },
    { id: 'polkadot', days: '90' },
    { id: 'ripple', days: '90' },
    { id: 'bitcoin', days: '180' },
    { id: 'cardano', days: '180' },
    { id: 'binancecoin', days: '180' },
    { id: 'dogecoin', days: '180' },
    { id: 'ethereum', days: '180' },
    { id: 'litecoin', days: '180' },
    { id: 'terra-luna', days: '180' },
    { id: 'solana', days: '180' },
    { id: 'polkadot', days: '180' },
    { id: 'ripple', days: '180' },
    { id: 'bitcoin', days: '365' },
    { id: 'cardano', days: '365' },
    { id: 'binancecoin', days: '365' },
    { id: 'dogecoin', days: '365' },
    { id: 'ethereum', days: '365' },
    { id: 'litecoin', days: '365' },
    { id: 'terra-luna', days: '365' },
    { id: 'solana', days: '365' },
    { id: 'polkadot', days: '365' },
    { id: 'ripple', days: '365' },
    { id: 'bitcoin', days: 'max' },
    { id: 'cardano', days: 'max' },
    { id: 'binancecoin', days: 'max' },
    { id: 'dogecoin', days: 'max' },
    { id: 'ethereum', days: 'max' },
    { id: 'litecoin', days: 'max' },
    { id: 'terra-luna', days: 'max' },
    { id: 'solana', days: 'max' },
    { id: 'polkadot', days: 'max' },
    { id: 'ripple', days: 'max' },
  ];

  private async upsertMarketChart(update: Partial<MarketChartEntity>): Promise<Partial<MarketChartEntity> | void> {
    try {
      const findRow = await this.marketChartRepository.findOneOrFail({ coin: update.coin, days: update.days });
      Object.assign(findRow, update);
      return await this.marketChartRepository.save(findRow);
    } catch (e) {
      try {
        return await this.marketChartRepository.save(update);
      } catch (e) {}
    }
  }

  private getFromCoingecko(id: string, days: string): Promise<[]> {
    return new Promise(async (resolve, reject) => {
      const result: CoinGeckoResponse = await this.coinGeckoClient.coins.fetchMarketChart(id, {
        days,
      });

      await this.upsertMarketChart({ coin: id, days, chart_data: JSON.stringify(result.data.prices) });
      if (result.message != 'OK') {
        reject('Not fetch from coinGecko');
      }

      resolve(result.data.prices);
    });
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  getMarketCharts(): void {
    this.coingeckoInputs.forEach((element, i) => {
      setTimeout(async () => {
        await this.getFromCoingecko(element.id, element.days);
      }, i * 60000);
    });
  }

  marketChart(coin: string, days: string): Promise<MarketChartEntity | undefined> {
    //Transform to coin format in db
    switch (coin) {
      case 'binance coin':
        coin = 'binancecoin';
        break;

      case 'terra':
        coin = 'terra-luna';
        break;

      case 'xrp':
        coin = 'ripple';
        break;
    }

    return this.marketChartRepository.findOne({ coin, days });
  }
}
