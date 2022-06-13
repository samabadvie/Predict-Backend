import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { StoreItemTypeEnum } from '../enums/store-item-type.enum';
import { StorePriceUnitEnum } from '../enums/store-price-unit.enum';

export class CreateStoreItemDto {
  @IsNotEmpty()
  @IsEnum(StoreItemTypeEnum)
  type!: StoreItemTypeEnum;

  @IsNotEmpty()
  @IsNumber()
  value!: number;

  @IsNotEmpty()
  @IsNumber()
  price!: number;

  @IsNotEmpty()
  @IsEnum(StorePriceUnitEnum)
  price_unit!: StorePriceUnitEnum;
}
