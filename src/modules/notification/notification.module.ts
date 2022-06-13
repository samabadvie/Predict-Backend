import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationHistoryController } from './controllers/notification-history.controller';
import { NotificationAssetEntity } from './entities/notification-assets.entity';
import { NotificationHistoryEntity } from './entities/notification-history.entity';
import { FCMNotificationService } from './services/fcm-notification.service';
import { NotificationAssetsService } from './services/notification-assets.service';
import { NotificationHistoryService } from './services/notification-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationAssetEntity, NotificationHistoryEntity], 'mysql')],
  controllers: [NotificationHistoryController],
  providers: [FCMNotificationService, NotificationAssetsService, NotificationHistoryService],
  exports: [FCMNotificationService, NotificationAssetsService, NotificationHistoryService],
})
export class NotificationModule {}
