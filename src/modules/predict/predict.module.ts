import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadgesModule } from 'modules/badges/badges.module';
import { NotificationModule } from 'modules/notification/notification.module';
import { UserLevelsModule } from 'modules/user-level/user-levels.module';
import { UsersModule } from 'modules/users/users.module';
import { UpdateRankFromScoreConsumer } from './consumers/update-rank-from-score.consumer';
import { WaitingPredictQueueConsumer } from './consumers/waiting-predict-queue.consumer';
import { PredictController } from './controllers/predict.controller';
import { ScoreController } from './controllers/score.controller';
import { PointEntity } from './entities/points.entity';
import { PredictEntity } from './entities/predict.entity';
import { ScoreEntity } from './entities/scores.entity';
import { QueueProducer } from './producers/queue.producer';
import { QUEUES } from './queues';
import { PointService } from './services/points.service';
import { PredictService } from './services/predict.service';
import { ScoreService } from './services/scores.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PredictEntity, PointEntity, ScoreEntity], 'mysql'),
    forwardRef(() => UsersModule),
    BadgesModule,
    forwardRef(() => UserLevelsModule),
    forwardRef(() => NotificationModule),
    BullModule.registerQueue(
      {
        name: 'predictUpdates',
        defaultJobOptions: {
          removeOnFail: false,
          removeOnComplete: true,
        },
      },
      {
        name: QUEUES.UPDATES,
        defaultJobOptions: {
          removeOnFail: false,
          removeOnComplete: true,
        },
      },
      {
        name: QUEUES.WAITING_PREDICTIONS,
        defaultJobOptions: {
          removeOnFail: false,
          removeOnComplete: true,
        },
      },
      {
        name: QUEUES.NEW_SCORE,
        defaultJobOptions: {
          removeOnFail: false,
          removeOnComplete: true,
        },
      },
    ),
  ],
  controllers: [PredictController, ScoreController],
  providers: [
    PredictService,
    PointService,
    ScoreService,
    QueueProducer,
    WaitingPredictQueueConsumer,
    UpdateRankFromScoreConsumer,
  ],
  exports: [
    PredictService,
    PointService,
    ScoreService,
    QueueProducer,
    WaitingPredictQueueConsumer,
    UpdateRankFromScoreConsumer,
  ],
})
export class PredictModule {}
