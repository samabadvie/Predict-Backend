import { NotificationHistoryEntity } from '../entities/notification-history.entity';

export class NotificationHistorySchema {
  count!: number;

  history!: NotificationHistoryEntity[];
}
