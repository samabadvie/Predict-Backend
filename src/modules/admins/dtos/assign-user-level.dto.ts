import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AssignUserLevelDto {
  @IsNotEmpty()
  @IsNumber()
  @Transform((v) => Number(v.value))
  levelId!: number;

  @IsNotEmpty()
  @IsString()
  username!: string;
}
