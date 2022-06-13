import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from 'modules/auth/guards/api-key.guard';
import { CurrencyEntity } from '../entities/currencies.entity';
import { CurrencyService } from '../services/currency.service';

@ApiTags('Currencies')
@ApiSecurity('X-Api-Key')
@UseGuards(ApiKeyAuthGuard)
@Controller('Currencies')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('')
  findAll(): Promise<CurrencyEntity[]> {
    return this.currencyService.findAll();
  }
}
