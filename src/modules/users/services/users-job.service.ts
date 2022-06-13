import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType } from 'modules/notification/enums/notification-type.enum';
import { FCMNotificationService } from 'modules/notification/services/fcm-notification.service';
import { NotificationAssetsService } from 'modules/notification/services/notification-assets.service';
import { UpdateTypesEnum } from '../enums/update-types.enum';
import { QueueProducer } from '../producers/queue.producer';
import { RewardSilverChipsService } from './reward-silver-chips.service';
import { UsersService } from './users.services';

@Injectable()
export class UsersJobService {
  constructor(
    private readonly usersService: UsersService,
    private readonly rewardSilverChipsService: RewardSilverChipsService,
    private readonly queueProducer: QueueProducer,

    @Inject(forwardRef(() => FCMNotificationService))
    private readonly fcmNotificationService: FCMNotificationService,

    @Inject(forwardRef(() => NotificationAssetsService))
    private readonly notificationAssetsService: NotificationAssetsService,
  ) {}

  async testSilverChipsReward(username: string, amount: number): Promise<void> {
    const user = await this.usersService.findUserByUsername(username);

    if (user) {
      await this.usersService.updateUser({ id: user.id }, { silver_chips: user.silver_chips + amount });
      await this.queueProducer.updatesQueue.add({
        user_id: user.id,
        silver_chips: user.silver_chips + amount,
        silver_chips_amount: amount,
        type: UpdateTypesEnum.SILVER_CHIPS,
      });
    }
  }

  @Cron(CronExpression.EVERY_4_HOURS)
  async rewardSilverChips(): Promise<void> {
    const users = await this.usersService.findAll();
    users.forEach(async (user) => {
      let silver_chips: number, silver_chips_amount: number;
      const userNotification = await this.usersService.findUserRelation(user.username, 'notification');

      if (user.silver_chips + 10 > user.silver_chips_max) {
        silver_chips = user.silver_chips_max;
        silver_chips_amount = user.silver_chips_max - user.silver_chips;
      } else {
        silver_chips = user.silver_chips + 10;
        silver_chips_amount = 10;
      }

      if (silver_chips_amount != 0) {
        await this.usersService.updateUser({ id: user.id }, { silver_chips });
        await this.rewardSilverChipsService.add({ user_id: user.id, silver_chips_amount, time: new Date() });
        await this.queueProducer.updatesQueue.add({
          user_id: user.id,
          silver_chips,
          silver_chips_amount,
          type: UpdateTypesEnum.SILVER_CHIPS,
        });

        if (userNotification.notification.chip_reception && user.fcm_token) {
          await this.fcmNotificationService.pushNotification(
            user.username,
            `Hooray! ${silver_chips_amount} more Silver Chips!`,
            `Omenium sent you ${silver_chips_amount} Silver Chips. Let's predict!`,
            user.fcm_token,
            (
              await this.notificationAssetsService.findOne({ name: NotificationType.SILVER_CHIPS_RECEIVE })
            ).icon,
            NotificationType.SILVER_CHIPS_RECEIVE,
          );
        }
      }
    });
  }
}
