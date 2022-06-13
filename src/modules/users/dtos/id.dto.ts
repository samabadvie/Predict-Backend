import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';
export class IdDto {
  @IsNotEmpty()
  @Transform((v) => +v.value)
  @IsNumber()
  id!: number;
}
