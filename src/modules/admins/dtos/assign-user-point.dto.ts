import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AssignUserPointDto {
  @IsNotEmpty()
  @IsNumber()
  @Transform((v) => Number(v.value))
  point!: number;

  @IsNotEmpty()
  @IsString()
  username!: string;
}
