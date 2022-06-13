import { IsNumber, IsOptional, IsEnum, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserSortByTimeEnum } from '../enums/user-sort-by-time.enum';
import { UserSortByTypeEnum } from '../enums/user-sort-by-type.enum';

export class GetRankingDto {
  @IsOptional()
  @Transform((v) => Number(v.value))
  @IsNumber()
  page?: number;

  @IsOptional()
  @Transform((v) => Number(v.value))
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsEnum(UserSortByTimeEnum)
  time?: UserSortByTimeEnum;

  @IsOptional()
  @IsEnum(UserSortByTypeEnum)
  type?: UserSortByTypeEnum;

  @IsOptional()
  @IsString()
  q?: string;
}
