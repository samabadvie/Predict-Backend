import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  prediction_result?: boolean;

  @IsOptional()
  @IsBoolean()
  access_request?: boolean;

  @IsOptional()
  @IsBoolean()
  followed_by_user?: boolean;

  @IsOptional()
  @IsBoolean()
  league_upgrade?: boolean;

  @IsOptional()
  @IsBoolean()
  progress_upgrade?: boolean;

  @IsOptional()
  @IsBoolean()
  badge_received?: boolean;

  @IsOptional()
  @IsBoolean()
  chip_reception?: boolean;

  @IsOptional()
  @IsBoolean()
  app_push_notification?: boolean;
}
