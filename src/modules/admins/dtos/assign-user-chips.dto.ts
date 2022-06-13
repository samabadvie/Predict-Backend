import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AssignUserChipsDto {
  @IsOptional()
  @IsNumber()
  @Transform((v) => Number(v.value))
  silver_chips?: number;

  @IsOptional()
  @IsNumber()
  @Transform((v) => Number(v.value))
  golden_chips?: number;

  @IsNotEmpty()
  @IsString()
  username!: string;
}
