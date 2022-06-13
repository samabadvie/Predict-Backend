import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from 'modules/auth/guards/api-key.guard';
import { CoinsEntity } from '../entities/coins.entity';
import { CoinService } from '../services/coin.service';

@ApiTags('Coins')
@ApiSecurity('X-Api-Key')
@UseGuards(ApiKeyAuthGuard)
@Controller('Coins')
export class CoinController {
  constructor(private readonly coinService: CoinService) {}

  @Get('')
  findAll(): Promise<CoinsEntity[]> {
    return this.coinService.findAll();
  }
}
