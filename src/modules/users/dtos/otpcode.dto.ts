import { IsNotEmpty, IsString, Length } from 'class-validator';

export class OtpcodeDto {
  @IsNotEmpty()
  @IsString()
  @Length(6)
  otpcode!: string;
}
