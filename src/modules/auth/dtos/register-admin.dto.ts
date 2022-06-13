import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterAdminDto {
  @IsNotEmpty()
  @IsString()
  username!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])/, {
    message: 'Given password is not strong enough. it most contain uppercase, lowercase.',
  })
  password!: string;
}
