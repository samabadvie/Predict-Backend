import { CoinSymbolEnum } from '../enums/coin-symbol.enum';

export class PricesSchema {
  id!: string;

  symbol!: CoinSymbolEnum;

  value!: string;
}
