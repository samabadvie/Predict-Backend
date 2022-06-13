import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetPredictsDto {
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
  coin?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  time?: string;
}
