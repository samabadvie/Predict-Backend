import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CoingeckoCoinDto {
  @IsNotEmpty()
  @IsString()
  @Transform((v) => v.value.toLowerCase())
  coin!: string;
}
