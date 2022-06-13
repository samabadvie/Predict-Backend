import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvatarEntity } from '../entities/avatar.entity';

@Injectable()
export class AvatarsService {
  constructor(
    @InjectRepository(AvatarEntity, 'mysql')
    private readonly currencyRepository: Repository<AvatarEntity>,
  ) {}

  find(input: Partial<AvatarEntity>): Promise<AvatarEntity[]> {
    return this.currencyRepository.find(input);
  }

  findOne(input: Partial<AvatarEntity>): Promise<AvatarEntity | undefined> {
    return this.currencyRepository.findOne(input);
  }
}
