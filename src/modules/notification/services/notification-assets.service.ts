import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationAssetEntity } from '../entities/notification-assets.entity';

@Injectable()
export class NotificationAssetsService {
  constructor(
    @InjectRepository(NotificationAssetEntity, 'mysql')
    private readonly notificationAssetRepository: Repository<NotificationAssetEntity>,
  ) {}

  findOne(input: Partial<NotificationAssetEntity>): Promise<NotificationAssetEntity> {
    return this.notificationAssetRepository.findOneOrFail(input);
  }
}
