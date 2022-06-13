/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { configService } from 'core/config.service';
import FCM from 'fcm-node';
import { Repository } from 'typeorm';
import { NotificationHistoryEntity } from '../entities/notification-history.entity';

@Injectable()
export class FCMNotificationService {
  constructor(
    @InjectRepository(NotificationHistoryEntity, 'mysql')
    private readonly notificationHistoryRepository: Repository<NotificationHistoryEntity>,
  ) {}

  async pushNotification(
    username: string,
    title: string,
    body: string,
    to: string,
    icon: string,
    type: string,
    data?: any,
    another_user?: string,
  ): Promise<string> {
    const fcm = new FCM(configService.getFCMServerKey());

    const message: any = {
      to,
      data,
      notification: {
        title,
        body,
      },
    };

    await this.notificationHistoryRepository.save({
      username,
      another_user,
      title,
      body,
      time: new Date(),
      icon,
      type,
    });

    return new Promise((resolve, reject) => {
      fcm.send(message, (err: any, response: any) => {
        if (err) {
          reject('Something has gone wrong!' + err);
          reject('Response:! ' + response);
        } else {
          resolve('Successfully sent with response: ' + response);
        }
      });
    });
  }
}
