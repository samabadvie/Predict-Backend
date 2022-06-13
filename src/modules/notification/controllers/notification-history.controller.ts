import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { IReq } from 'core/interfaces';
import { ApiKeyAuthGuard } from 'modules/auth/guards/api-key.guard';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { GetNotificationHistoryDto } from '../dtos/get-notification-history.dto';
import { NotificationHistorySchema } from '../schemas/notification-history.schema';
import { NotificationHistoryService } from '../services/notification-history.service';

@ApiTags('Notification History')
@ApiSecurity('X-Api-Key')
@UseGuards(ApiKeyAuthGuard)
@Controller('notification-history')
export class NotificationHistoryController {
  constructor(private readonly notificationHistoryService: NotificationHistoryService) {}

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Get(':username/notification-history')
  getNotificationHistory(
    @Req() req: IReq,
    @Query() { page = 1, limit = 2000 }: GetNotificationHistoryDto,
  ): Promise<NotificationHistorySchema> {
    return this.notificationHistoryService.getNotificationHistory(req.user.username, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Get('lastNotificationTime')
  getLastNotificationTime(@Req() req: IReq): Promise<number> {
    return this.notificationHistoryService.getLastNotificationTime(req.user.username);
  }
}
