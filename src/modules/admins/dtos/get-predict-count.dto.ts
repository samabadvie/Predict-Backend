import { IsEnum, IsNotEmpty } from 'class-validator';
import { CoinSymbolEnum } from 'modules/predict/enums/coin-symbol.enum';

export class GetPredictCountDto {
  @IsNotEmpty()
  @IsEnum(CoinSymbolEnum)
  symbol!: CoinSymbolEnum;
}
