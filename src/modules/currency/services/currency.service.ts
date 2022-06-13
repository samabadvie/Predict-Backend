import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrencyEntity } from '../entities/currencies.entity';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectRepository(CurrencyEntity, 'mysql')
    private readonly currencyRepository: Repository<CurrencyEntity>, // @Inject(forwardRef(() => EmailService)) // private readonly emailService: EmailService,
  ) {}

  findAll(): Promise<CurrencyEntity[]> {
    return this.currencyRepository.find();
  }

  findOne(input: Partial<CurrencyEntity>): Promise<CurrencyEntity | undefined> {
    return this.currencyRepository.findOne(input);
  }
}
