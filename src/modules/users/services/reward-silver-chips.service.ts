import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardSilverChipsEntity } from '../entities/reward-silver-chips.entity';

@Injectable()
export class RewardSilverChipsService {
  constructor(
    @InjectRepository(RewardSilverChipsEntity, 'mysql')
    private readonly RewardSilverChipsRepository: Repository<RewardSilverChipsEntity>,
  ) {}

  add(input: Partial<RewardSilverChipsEntity>): Promise<RewardSilverChipsEntity> {
    return this.RewardSilverChipsRepository.save(input);
  }
}
