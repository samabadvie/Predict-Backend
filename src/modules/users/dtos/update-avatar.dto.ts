import { IsNotEmpty, IsNumber } from 'class-validator';
export class UpdateAvatarDto {
  @IsNotEmpty()
  @IsNumber()
  id!: number;
}
