import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoinsEntity } from '../entities/coins.entity';

@Injectable()
export class CoinService {
  constructor(
    @InjectRepository(CoinsEntity, 'mysql')
    private readonly coinsRepository: Repository<CoinsEntity>,
  ) {}

  findAll(): Promise<CoinsEntity[]> {
    return this.coinsRepository.find();
  }

  findOne(input: Partial<CoinsEntity>): Promise<CoinsEntity | undefined> {
    return this.coinsRepository.findOne(input);
  }
}
