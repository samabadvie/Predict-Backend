import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinController } from './controllers/coin.controller';
import { CoinsEntity } from './entities/coins.entity';
import { CoinService } from './services/coin.service';

@Module({
  imports: [TypeOrmModule.forFeature([CoinsEntity], 'mysql')],
  controllers: [CoinController],
  providers: [CoinService],
  exports: [CoinService],
})
export class CoinModule {}
