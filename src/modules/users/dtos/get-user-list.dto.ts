import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetUserListDto {
  @IsOptional()
  @Transform((v) => Number(v.value))
  @IsNumber()
  page?: number;

  @IsOptional()
  @Transform((v) => Number(v.value))
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  q?: string;
}
