import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
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

  @IsOptional()
  @IsString()
  referral_code!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;
}
