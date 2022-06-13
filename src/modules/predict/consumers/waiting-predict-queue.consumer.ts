import { Process, Processor } from '@nestjs/bull';
import { forwardRef, Inject, OnModuleInit } from '@nestjs/common';
import { Job } from 'bull';
import { BadgeEntity } from 'modules/badges/entities/badges.entity';
import { BadgesService } from 'modules/badges/services/badges.service';
import { NotificationType } from 'modules/notification/enums/notification-type.enum';
import { FCMNotificationService } from 'modules/notification/services/fcm-notification.service';
import { NotificationAssetsService } from 'modules/notification/services/notification-assets.service';
import { UserLevelEntity } from 'modules/user-level/entities/user-levels.entity';
import { UserLevelsService } from 'modules/user-level/services/user-levels.service';
import { PredictEntity } from '../entities/predict.entity';
import { UserEntity } from 'modules/users/entities/user.entity';
import { UpdateTypesEnum } from 'modules/users/enums/update-types.enum';
import { UsersService } from 'modules/users/services/users.services';
import { CoinSymbolEnum } from '../enums/coin-symbol.enum';
import { PredictDirectionEnum } from '../enums/predict-direction.enum';
import { PredictStatusEnum } from '../enums/predict-status.enum';
import { QueueProducer } from '../producers/queue.producer';
import { QUEUES } from '../queues';
import { PointService } from '../services/points.service';
import { PredictService } from '../services/predict.service';
import { ScoreService } from '../services/scores.service';

@Processor(QUEUES.WAITING_PREDICTIONS)
export class WaitingPredictQueueConsumer implements OnModuleInit {
  constructor(
    // @InjectQueue(QUEUES.WAITING_PREDICTIONS) private readonly updatesQueue: Queue,

    private readonly pointService: PointService,
    private readonly badgeService: BadgesService,
    private readonly predictService: PredictService,
    private readonly scoreService: ScoreService,

    private readonly queueProducer: QueueProducer,

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    @Inject(forwardRef(() => UserLevelsService))
    private readonly userLevelsService: UserLevelsService,

    @Inject(forwardRef(() => NotificationAssetsService))
    private readonly notificationAssetsService: NotificationAssetsService,

    @Inject(forwardRef(() => FCMNotificationService))
    private readonly fcmNotificationService: FCMNotificationService,
  ) {}

  badges: BadgeEntity[] = [];

  userLevels: UserLevelEntity[] = [];

  async onModuleInit(): Promise<void> {
    this.badges = await this.badgeService.findAll();
    this.userLevels = await this.userLevelsService.findAll();
  }

  @Process('predictJob')
  async waitings(job: Job<PredictEntity>): Promise<void> {
    let newPoint;
    const currentTime = new Date();

    console.log(currentTime, ' - predictJob id:', job.data.id);

    if (job.data.direction == PredictDirectionEnum.UP) {
      if (Number(job.data.end_value) >= Number(job.data.start_value)) {
        job.data.status = PredictStatusEnum.SUCCESS;
        newPoint = Number(job.data.point);
      } else {
        job.data.status = PredictStatusEnum.FAIL;
        newPoint = -1 * Number(job.data.point);
      }
    } else {
      if (Number(job.data.end_value) <= Number(job.data.start_value)) {
        job.data.status = PredictStatusEnum.SUCCESS;
        newPoint = Number(job.data.point);
      } else {
        job.data.status = PredictStatusEnum.FAIL;
        newPoint = -1 * Number(job.data.point);
      }
    }

    const user = await this.usersService.findUserById(job.data.user_id);

    if (user) {
      let badgeCount = 0;

      const currentLevel = (await this.usersService.findUserRelation(user.username, 'user_level')).user_level.id;
      const nextLevel = await this.userLevelsService.findWithId(currentLevel + 1);

      const score = this.scoreService.getScore(Number(job.data.point), user.points, job.data.status);

      const updateUser: Partial<UserEntity> = {
        points:
          user.points != 0
            ? user.points + newPoint
            : job.data.status == PredictStatusEnum.SUCCESS
            ? user.points + newPoint
            : 0,
        available_points:
          user.points != 0
            ? user.points + newPoint
            : job.data.status == PredictStatusEnum.SUCCESS
            ? user.points + newPoint
            : 100,
        silver_chips: job.data.status == PredictStatusEnum.SUCCESS ? user.silver_chips + 1 : user.silver_chips,
        total_wins: job.data.status == PredictStatusEnum.SUCCESS ? user.total_wins + 1 : user.total_wins,
        win_streaks: job.data.status == PredictStatusEnum.SUCCESS ? user.win_streaks + 1 : 0,
        score: (score + Number(user.score)).toString(),
      };

      if (job.data.status == PredictStatusEnum.SUCCESS) {
        if (user.max_win_streaks < user.win_streaks + 1) {
          await this.usersService.updateUser({ id: user.id }, { max_win_streaks: user.win_streaks + 1 });
        }
      }

      switch (job.data.symbol) {
        case CoinSymbolEnum.BTC:
          updateUser.btc_win_streaks = job.data.status == PredictStatusEnum.SUCCESS ? user.btc_win_streaks + 1 : 0;
          break;
        case CoinSymbolEnum.ETH:
          updateUser.eth_win_streaks = job.data.status == PredictStatusEnum.SUCCESS ? user.eth_win_streaks + 1 : 0;
          break;
        default:
          updateUser.altcoins_win_streaks =
            job.data.status == PredictStatusEnum.SUCCESS ? user.altcoins_win_streaks + 1 : 0;
          break;
      }

      const pointsBadge = this.badges.find((x) => x.name == 'Points' && x.level == user.point_level + 1)?.count;
      const conditionPoint = pointsBadge || 0;
      const currentPoint = updateUser.points ? updateUser.points : 0;

      const updateLevel: Partial<UserEntity> = {
        total_wins_level:
          this.badges.find((x) => x.name == 'Total_Wins' && x.level == user.total_wins_level + 1)?.count ==
          updateUser.total_wins
            ? this.badges.find((x) => x.name == 'Total_Wins' && x.level == user.total_wins_level + 1)?.level
            : user.total_wins_level,

        win_streaks_level:
          this.badges.find((x) => x.name == 'Win_Streaks' && x.level == user.win_streaks_level + 1)?.count ==
          updateUser.win_streaks
            ? this.badges.find((x) => x.name == 'Win_Streaks' && x.level == user.win_streaks_level + 1)?.level
            : user.total_wins_level,

        btc_win_streaks_level:
          this.badges.find((x) => x.name == 'Btc_Win_Streaks' && x.level == user.btc_win_streaks_level + 1)?.count ==
          updateUser.btc_win_streaks
            ? this.badges.find((x) => x.name == 'Btc_Win_Streaks' && x.level == user.btc_win_streaks_level + 1)?.level
            : user.btc_win_streaks_level,

        eth_streaks_level:
          this.badges.find((x) => x.name == 'Eth_Win_Streaks' && x.level == user.eth_streaks_level + 1)?.count ==
          updateUser.eth_win_streaks
            ? this.badges.find((x) => x.name == 'Eth_Win_Streaks' && x.level == user.eth_streaks_level + 1)?.level
            : user.eth_streaks_level,

        altcoins_win_streaks_level:
          this.badges.find((x) => x.name == 'Altcoins_Win_Streaks' && x.level == user.altcoins_win_streaks_level + 1)
            ?.count == updateUser.altcoins_win_streaks
            ? this.badges.find(
                (x) => x.name == 'Altcoins_Win_Streaks' && x.level == user.altcoins_win_streaks_level + 1,
              )?.level
            : user.altcoins_win_streaks_level,

        point_level:
          conditionPoint <= currentPoint
            ? this.badges.find((x) => x.name == 'Points' && x.level == user.point_level + 1)?.level
            : user.point_level,
      };

      await this.predictService.update({ id: job.data.id }, job.data);
      await this.usersService.updateUser({ id: job.data.user_id }, updateUser);
      await this.usersService.updateUser({ id: job.data.user_id }, updateLevel);

      const userNotification = await this.usersService.findUserRelation(user.username, 'notification');

      if (updateLevel.total_wins_level == user.total_wins_level + 1) {
        const updateBadge = this.badges.find((x) => x.name == 'Total_Wins' && x.level == user.total_wins_level + 1);

        if (userNotification.notification.badge_received && user.fcm_token) {
          await this.fcmNotificationService.pushNotification(
            user.username,
            `Hooray! New badge received!`,
            `You got level ${updateLevel.total_wins_level} of "Total Wins" badge."`,
            user.fcm_token,
            (
              await this.notificationAssetsService.findOne({
                name: NotificationType.BADGE_RECEIVE,
                type: 'Total Wins',
              })
            ).icon,
            NotificationType.BADGE_RECEIVE,
          );
        }

        await this.queueProducer.updatesQueue.add({
          user_id: user.id,
          badge_id: updateBadge?.id,
          badge_name: 'Total Wins',
          icon: updateBadge?.icon,
          level: updateBadge?.level,
          type: UpdateTypesEnum.BADGES,
        });
      }

      if (updateLevel.win_streaks_level == user.win_streaks_level + 1) {
        const updateBadge = this.badges.find((x) => x.name == 'Win_Streaks' && x.level == user.win_streaks_level + 1);

        if (userNotification.notification.badge_received && user.fcm_token) {
          await this.fcmNotificationService.pushNotification(
            user.username,
            `Hooray! New badge received!`,
            `You got level ${updateLevel.win_streaks_level} of "Win Streaks" badge."`,
            user.fcm_token,
            (
              await this.notificationAssetsService.findOne({
                name: NotificationType.BADGE_RECEIVE,
                type: 'Win Streaks',
              })
            ).icon,
            NotificationType.BADGE_RECEIVE,
          );
        }

        await this.queueProducer.updatesQueue.add({
          user_id: user.id,
          badge_id: updateBadge?.id,
          badge_name: 'Win Streaks',
          icon: updateBadge?.icon,
          level: updateBadge?.level,
          type: UpdateTypesEnum.BADGES,
        });
      }

      if (updateLevel.btc_win_streaks_level == user.btc_win_streaks_level + 1) {
        const updateBadge = this.badges.find(
          (x) => x.name == 'Btc_Win_Streaks' && x.level == user.btc_win_streaks_level + 1,
        );

        if (userNotification.notification.badge_received && user.fcm_token) {
          await this.fcmNotificationService.pushNotification(
            user.username,
            `Hooray! New badge received!`,
            `You got level ${updateLevel.btc_win_streaks_level} of "BTC Win Streaks" badge."`,
            user.fcm_token,
            (
              await this.notificationAssetsService.findOne({
                name: NotificationType.BADGE_RECEIVE,
                type: 'Btc Win Streaks',
              })
            ).icon,
            NotificationType.BADGE_RECEIVE,
          );
        }

        await this.queueProducer.updatesQueue.add({
          user_id: user.id,
          badge_id: updateBadge?.id,
          badge_name: 'BTC Win Streaks',
          icon: updateBadge?.icon,
          level: updateBadge?.level,
          type: UpdateTypesEnum.BADGES,
        });
      }

      if (updateLevel.eth_streaks_level == user.eth_streaks_level + 1) {
        const updateBadge = this.badges.find(
          (x) => x.name == 'Eth_Win_Streaks' && x.level == user.eth_streaks_level + 1,
        );

        if (userNotification.notification.badge_received && user.fcm_token) {
          await this.fcmNotificationService.pushNotification(
            user.username,
            `Hooray! New badge received!`,
            `You got level ${updateLevel.eth_streaks_level} of "Eth Win Streaks" badge."`,
            user.fcm_token,
            (
              await this.notificationAssetsService.findOne({
                name: NotificationType.BADGE_RECEIVE,
                type: 'Eth Win Streaks',
              })
            ).icon,
            NotificationType.BADGE_RECEIVE,
          );
        }

        await this.queueProducer.updatesQueue.add({
          user_id: user.id,
          badge_id: updateBadge?.id,
          badge_name: 'Eth Win Streaks',
          icon: updateBadge?.icon,
          level: updateBadge?.level,
          type: UpdateTypesEnum.BADGES,
        });
      }

      if (updateLevel.altcoins_win_streaks_level == user.altcoins_win_streaks_level + 1) {
        const updateBadge = this.badges.find(
          (x) => x.name == 'Altcoins_Win_Streaks' && x.level == user.altcoins_win_streaks_level + 1,
        );

        if (userNotification.notification.badge_received && user.fcm_token) {
          await this.fcmNotificationService.pushNotification(
            user.username,
            `Hooray! New badge received!`,
            `You got level ${updateLevel.altcoins_win_streaks_level} of "Altcoins Win Streaks" badge."`,
            user.fcm_token,
            (
              await this.notificationAssetsService.findOne({
                name: NotificationType.BADGE_RECEIVE,
                type: 'Altcoins Win Streaks',
              })
            ).icon,
            NotificationType.BADGE_RECEIVE,
          );
        }

        await this.queueProducer.updatesQueue.add({
          user_id: user.id,
          badge_id: updateBadge?.id,
          badge_name: 'Altcoins Win Streaks',
          icon: updateBadge?.icon,
          level: updateBadge?.level,
          type: UpdateTypesEnum.BADGES,
        });
      }

      if (nextLevel) {
        //check user-level upgrade
        if (updateLevel.total_wins_level == nextLevel?.total_wins_level) {
          badgeCount++;
        }
        if (updateLevel.win_streaks_level == nextLevel?.win_streaks_level) {
          badgeCount++;
        }

        if (updateLevel.btc_win_streaks_level == nextLevel?.btc_win_streaks_level) {
          badgeCount++;
        }
        if (updateLevel.eth_streaks_level == nextLevel?.eth_win_streaks_level) {
          badgeCount++;
        }
        if (updateLevel.altcoins_win_streaks_level == nextLevel?.altcoins_win_streaks_level) {
          badgeCount++;
        }

        if (updateLevel.point_level == user.point_level + 1) {
          const updateBadge = this.badges.find((x) => x.name == 'Points' && x.level == user.point_level + 1);

          if (user.fcm_token && userNotification.notification.badge_received) {
            await this.fcmNotificationService.pushNotification(
              user.username,
              `Hooray! New badge received!`,
              `You got level ${updateLevel.point_level} of "Points" badge."`,
              user.fcm_token,
              (
                await this.notificationAssetsService.findOne({ name: NotificationType.BADGE_RECEIVE, type: 'Points' })
              ).icon,
              NotificationType.BADGE_RECEIVE,
            );
          }

          await this.queueProducer.updatesQueue.add({
            user_id: user.id,
            badge_id: updateBadge?.id,
            badge_name: 'Points',
            icon: updateBadge?.icon,
            level: updateBadge?.level,
            type: UpdateTypesEnum.BADGES,
          });
        }

        //TODO: add num of followers check
        if (
          badgeCount >= nextLevel.min_badges &&
          user.points + newPoint >= nextLevel.points &&
          user.golden_chips >= nextLevel.num_of_gold_chips
        ) {
          await this.usersService.updateUser({ id: user.id }, { user_level: nextLevel });

          if (userNotification.notification.progress_upgrade && user.fcm_token) {
            await this.fcmNotificationService.pushNotification(
              user.username,
              `Level Upgrade!`,
              `Congratulations! You are now a ${nextLevel.name}`,
              user.fcm_token,
              (
                await this.notificationAssetsService.findOne({
                  name: NotificationType.LEVEL_UPGRADE,
                  type: nextLevel.name,
                })
              ).icon,
              NotificationType.LEVEL_UPGRADE,
            );
          }
        }
      }

      const user_data = await this.usersService.findUserRelation(user.username, 'user_level');
      const maxWinStreaks = await this.badgeService.findWithNameAndLevel(
        'Win_Streaks',
        updateUser?.win_streaks_level ? updateUser.win_streaks_level : user_data.win_streaks_level,
      );
      (user_data.win_streaks = user_data.win_streaks > maxWinStreaks ? user_data.win_streaks : maxWinStreaks),
        await this.queueProducer.predictUpdatesQueue.add({
          id: job.data.id,
          status: job.data.status,
          predict_point: newPoint,
          user_data,
          score: (score + Number(user.score)).toString(),
        });

      //add new to points entity
      await this.pointService.create({ user, point: newPoint, time: currentTime });

      if (userNotification.notification.prediction_result && user.fcm_token) {
        await this.fcmNotificationService.pushNotification(
          user.username,
          `Your ${job.data.symbol} prediction result is ready!`,
          job.data.status == PredictStatusEnum.SUCCESS
            ? `Congratulation! You won ${job.data.point} points ...`
            : `Sorry! You lost ${job.data.point} points ...`,
          user.fcm_token,
          (
            await this.notificationAssetsService.findOne({
              name: NotificationType.PREDICTION_RESULT,
              type: job.data.status == PredictStatusEnum.SUCCESS ? PredictStatusEnum.SUCCESS : PredictStatusEnum.FAIL,
            })
          ).icon,
          NotificationType.PREDICTION_RESULT,
        );
      }

      //add to new score queue
      await this.queueProducer.newScoreQueue.add('newScoreJob', 'updateRank');
    }
  }
}
