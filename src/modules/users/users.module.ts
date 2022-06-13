import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './services/users.services';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersController } from './controllers/users.controller';
import { EmailModule } from '../email/email.module';
import { CurrencyModule } from '../currency/currency.module';
import { AvatarsModule } from '../avatars/avatars.module';
import { ProfilesController } from './controllers/profiles.controller';
import { OtpCodesEntity } from './entities/otpcode.entity';
import { LoginEntity } from './entities/login.entity';
import { CoinModule } from '../coins/coins.module';
import { UsersJobService } from './services/users-job.service';
import { RewardSilverChipsEntity } from './entities/reward-silver-chips.entity';
import { RewardSilverChipsService } from './services/reward-silver-chips.service';
import { BullModule } from '@nestjs/bull';
import { UserLevelsModule } from 'modules/user-level/user-levels.module';
import { BadgesModule } from 'modules/badges/badges.module';
import { PredictModule } from 'modules/predict/predict.module';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';
import { QUEUES } from 'modules/predict/queues';
import { QueueProducer } from './producers/queue.producer';
import { NotificationModule } from 'modules/notification/notification.module';
import { AccessRequestModule } from 'modules/access-request/access-request.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [UserEntity, OtpCodesEntity, LoginEntity, RewardSilverChipsEntity, NotificationEntity],
      'mysql',
    ),
    forwardRef(() => CurrencyModule),
    AvatarsModule,
    CoinModule,
    forwardRef(() => UserLevelsModule),
    BadgesModule,
    forwardRef(() => PredictModule),
    forwardRef(() => EmailModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => BadgesModule),
    forwardRef(() => AccessRequestModule),

    BullModule.registerQueue({
      name: QUEUES.UPDATES,
      defaultJobOptions: {
        removeOnFail: false,
        removeOnComplete: true,
      },
    }),
  ],
  controllers: [UsersController, ProfilesController, NotificationController],
  providers: [UsersService, UsersJobService, RewardSilverChipsService, NotificationService, QueueProducer],
  exports: [UsersService, UsersJobService, RewardSilverChipsService, NotificationService, QueueProducer],
})
export class UsersModule {}
