import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationHistoryEntity } from '../entities/notification-history.entity';
import { NotificationHistorySchema } from '../schemas/notification-history.schema';

@Injectable()
export class NotificationHistoryService {
  constructor(
    @InjectRepository(NotificationHistoryEntity, 'mysql')
    private readonly notificationHistoryRepository: Repository<NotificationHistoryEntity>,
  ) {}

  async getNotificationHistory(username: string, page: number, limit: number): Promise<NotificationHistorySchema> {
    const result: NotificationHistorySchema = new NotificationHistorySchema();

    result.count = await this.notificationHistoryRepository
      .createQueryBuilder('query')
      .where(`username = '${username}' `)
      .getCount();

    result.history = await this.notificationHistoryRepository
      .createQueryBuilder('query')
      .where(`username = '${username}' `)
      .orderBy('time', 'DESC')
      .take(limit)
      .skip((page - 1) * limit)
      .getMany();

    return result;
  }

  async getLastNotificationTime(username: string): Promise<number> {
    const result = await this.notificationHistoryRepository
      .createQueryBuilder('query')
      .where(`username = '${username}' `)
      .orderBy('time', 'DESC')
      .getOne();

    if (!result) {
      return 0;
    }

    return result.created_at.getTime();
  }
}
