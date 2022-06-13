import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateUserLevelDto {
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  max_point?: number;

  @IsOptional()
  @IsNumber()
  total_wins_level?: number;

  @IsOptional()
  @IsNumber()
  total_wins?: number;

  @IsOptional()
  @IsNumber()
  win_streaks_level?: number;

  @IsOptional()
  @IsNumber()
  btc_win_streaks_level?: number;

  @IsOptional()
  @IsNumber()
  eth_win_streaks_level?: number;

  @IsOptional()
  @IsNumber()
  altcoins_win_streaks_level?: number;

  @IsOptional()
  @IsNumber()
  min_badges?: number;

  @IsOptional()
  @IsNumber()
  points?: number;

  @IsOptional()
  @IsNumber()
  num_of_sliver_chips?: number;

  @IsOptional()
  @IsNumber()
  num_of_gold_chips?: number;

  @IsOptional()
  @IsNumber()
  num_of_followers?: number;

  @IsOptional()
  @IsBoolean()
  allow_cancel_predict?: boolean;
}
