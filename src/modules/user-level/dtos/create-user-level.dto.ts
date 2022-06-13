import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateUserLevelDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsNumber()
  max_point!: number;

  @IsNotEmpty()
  @IsNumber()
  total_wins_level!: number;

  @IsNotEmpty()
  @IsNumber()
  win_streaks_level!: number;

  @IsNotEmpty()
  @IsNumber()
  btc_win_streaks_level!: number;

  @IsNotEmpty()
  @IsNumber()
  eth_win_streaks_level!: number;

  @IsNotEmpty()
  @IsNumber()
  altcoins_win_streaks_level!: number;

  @IsNotEmpty()
  @IsNumber()
  min_badges!: number;

  @IsNotEmpty()
  @IsNumber()
  points!: number;

  @IsNotEmpty()
  @IsNumber()
  num_of_sliver_chips!: number;

  @IsNotEmpty()
  @IsNumber()
  num_of_gold_chips!: number;

  @IsNotEmpty()
  @IsNumber()
  num_of_followers!: number;

  @IsNotEmpty()
  @IsBoolean()
  allow_cancel_predict!: boolean;
}
