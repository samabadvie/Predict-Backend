import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { IReq } from 'core/interfaces';
import { ApiKeyAuthGuard } from 'modules/auth/guards/api-key.guard';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { UpdateNotificationSettingsDto } from '../dtos/update-notification-settings.dto';
import { NotificationEntity } from '../entities/notification.entity';
import { NotificationService } from '../services/notification.service';

@ApiTags('Notifications')
@ApiSecurity('X-Api-Key')
@UseGuards(ApiKeyAuthGuard)
@Controller('Notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Get('')
  getNotificationSettings(@Req() req: IReq): Promise<NotificationEntity | undefined> {
    return this.notificationService.findOneWithUserId(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Patch('updateNotificationSettings')
  updateNotificationSettings(
    @Req() req: IReq,
    @Body() body: UpdateNotificationSettingsDto,
  ): Promise<Partial<NotificationEntity> | void> {
    return this.notificationService.updateOne(body, req.user.id);
  }
}
