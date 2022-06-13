import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CoinSymbolEnum } from '../enums/coin-symbol.enum';
import { PredictDirectionEnum } from '../enums/predict-direction.enum';
import { PredictTimeEnum } from '../enums/predict-time.enum';

export class PostPredictDto {
  @IsNotEmpty()
  @IsString()
  value!: string;

  @IsNotEmpty()
  @IsEnum(CoinSymbolEnum)
  symbol!: CoinSymbolEnum;

  @IsNotEmpty()
  @IsEnum(PredictTimeEnum)
  time!: PredictTimeEnum;

  @IsNotEmpty()
  @Transform((v) => Number(v.value))
  @IsNumber()
  point!: number;

  @IsNotEmpty()
  @IsEnum(PredictDirectionEnum)
  direction!: PredictDirectionEnum;
}
