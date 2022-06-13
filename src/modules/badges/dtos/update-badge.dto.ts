import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateBadgeDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsNumber()
  level!: number;

  @IsOptional()
  @IsNumber()
  count!: number;
}
