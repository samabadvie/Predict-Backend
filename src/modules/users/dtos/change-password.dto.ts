import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])/, {
    message: 'Given password is not strong enough. it most contain uppercase, lowercase.',
  })
  current_pass!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])/, {
    message: 'Given password is not strong enough. it most contain uppercase, lowercase.',
  })
  new_pass!: string;

  @IsOptional()
  @IsString()
  confirm_new_pass!: string;
}
