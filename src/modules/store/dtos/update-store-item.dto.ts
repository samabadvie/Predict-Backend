import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { StorePriceUnitEnum } from '../enums/store-price-unit.enum';

export class UpdateStoreItemDto {
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsEnum(StorePriceUnitEnum)
  price_unit?: StorePriceUnitEnum;
}
