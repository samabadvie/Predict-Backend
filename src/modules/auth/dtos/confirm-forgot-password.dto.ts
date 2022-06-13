import { IsNotEmpty, IsEmail, IsString, Length } from 'class-validator';
import { ConnectionsEnum } from 'core/connections.enum';
import { Exists } from 'core/decorators';
import { UserEntity } from 'modules/users/entities/user.entity';

export class ConfirmForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  @Exists(UserEntity, 'email', ConnectionsEnum.MYSQL)
  email!: string;

  @IsNotEmpty()
  @IsString()
  @Length(6)
  otpcode!: string;
}
