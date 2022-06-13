import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { IReq } from 'core/interfaces';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { FCMNotificationService } from 'modules/notification/services/fcm-notification.service';
import { AppService } from './app.service';
import { ApiKeyAuthGuard } from './modules/auth/guards/api-key.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly FCM: FCMNotificationService) {}

  @Get()
  @ApiSecurity('X-Api-Key')
  @UseGuards(ApiKeyAuthGuard)
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Get('testJWTToken')
  getUserWithToken(@Req() req: IReq): string {
    return `Hello ${req.user.username}`;
  }

  @Post('test')
  sendTestNotification(): Promise<string> {
    return this.FCM.pushNotification(
      'zizoo',
      'Test Title',
      'test notification from Backend',
      'fzkZOiegRSO5jG9kB71N2x:APA91bE3AV1RKtKkdrnVqD6YQxKCgIiRnjigOssMMO9nEigzoYrLC6kd-gJdRCyswx9OB8aOd8O5GNHnr_b3ahHMYfkL7VpNGRyUXDPUWqriTFmS5MWiGVhKX7XrjVRPQk75MXvdXu6v',
      '',
      'test',
      { screen: 'OthersProfile', passedData: { username: 'username' } },
    );
  }
}
