import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from 'modules/notification/notification.module';
import { QUEUES } from 'modules/predict/queues';
import { UsersModule } from 'modules/users/users.module';
import { AccessRequestController } from './controllers/access-request.controller';
import { AccessRequestEntity } from './entities/access-request.entity';
import { AccessRequestService } from './services/access-request.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessRequestEntity], 'mysql'),
    forwardRef(() => UsersModule),
    forwardRef(() => NotificationModule),

    BullModule.registerQueue({
      name: QUEUES.UPDATES,
      defaultJobOptions: {
        removeOnFail: false,
        removeOnComplete: true,
      },
    }),
  ],
  controllers: [AccessRequestController],
  providers: [AccessRequestService],
  exports: [AccessRequestService],
})
export class AccessRequestModule {}
