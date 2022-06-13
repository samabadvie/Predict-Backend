import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist';
import { Repository } from 'typeorm';
import { UpdateNotificationSettingsDto } from '../dtos/update-notification-settings.dto';
import { NotificationEntity } from '../entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity, 'mysql')
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  private async upsert(
    user_id: number,
    update: Partial<NotificationEntity>,
  ): Promise<Partial<NotificationEntity> | void> {
    try {
      const findRow = await this.notificationRepository.findOneOrFail({ user_id });
      Object.assign(findRow, update);
      return await this.notificationRepository.save(findRow);
    } catch (e) {
      try {
        return await this.notificationRepository.save(update);
      } catch (e) {}
    }
  }

  create(input: Partial<NotificationEntity>): Promise<NotificationEntity> {
    return this.notificationRepository.save(input);
  }

  findOneWithUserId(user_id: number): Promise<NotificationEntity | undefined> {
    return this.notificationRepository.findOne({ user_id });
  }

  updateOne(input: UpdateNotificationSettingsDto, user_id: number): Promise<Partial<NotificationEntity> | void> {
    return this.upsert(user_id, input);
  }
}
