import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ConnectionsEnum } from 'core/connections.enum';
import { Exists } from 'core/decorators';
import { UserEntity } from 'modules/users/entities/user.entity';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  @Exists(UserEntity, 'email', ConnectionsEnum.MYSQL)
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])/, {
    message: 'Given password is not strong enough. it most contain uppercase, lowercase.',
  })
  password!: string;

  @IsNotEmpty()
  @IsString()
  confirm_password!: string;
}
