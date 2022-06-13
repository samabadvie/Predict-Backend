import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateBadgeDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsNumber()
  level!: number;

  @IsNotEmpty()
  @IsNumber()
  count!: number;
}
