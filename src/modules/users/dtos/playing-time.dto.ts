import { IsBoolean, IsNotEmpty } from 'class-validator';

export class PlayingTimeDto {
  @IsNotEmpty()
  @IsBoolean()
  start!: boolean;
}
