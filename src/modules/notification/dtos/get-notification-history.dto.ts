import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class GetNotificationHistoryDto {
  @IsOptional()
  @Transform((v) => Number(v.value))
  @IsNumber()
  page?: number;

  @IsOptional()
  @Transform((v) => Number(v.value))
  @IsNumber()
  limit?: number;
}
