import { IsNotEmpty, IsString } from 'class-validator';

export class FCMTokenDto {
  @IsNotEmpty()
  @IsString()
  fcm_token!: string;
}
