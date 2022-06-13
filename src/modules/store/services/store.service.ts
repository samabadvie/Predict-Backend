import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseResponseSchema } from 'core/base-response.schema';
import { FlowException } from 'core/exceptions';
import { UserEntity } from 'modules/users/entities/user.entity';
import { UsersService } from 'modules/users/services/users.services';
import { Repository } from 'typeorm';
import { CreateStoreItemDto } from '../dtos/create-store-item.dto';
import { UpdateStoreItemDto } from '../dtos/update-store-item.dto';
import { StoreBuyersEntity } from '../entities/store-buyers.entity';
import { StoreItemEntity } from '../entities/store-item.entity';
import { StoreItemTypeEnum } from '../enums/store-item-type.enum';
import { StorePriceUnitEnum } from '../enums/store-price-unit.enum';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(StoreItemEntity, 'mysql')
    private readonly storeItemRepository: Repository<StoreItemEntity>,
    @InjectRepository(StoreBuyersEntity, 'mysql')
    private readonly storeBuyerRepository: Repository<StoreBuyersEntity>,

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  findAll(): Promise<StoreItemEntity[]> {
    return this.storeItemRepository.find();
  }

  createOne(input: CreateStoreItemDto): Promise<StoreItemEntity> {
    let icon;
    switch (input.type) {
      case StoreItemTypeEnum.SILVERBOX:
        icon = 'https://predict.alswap.com/store/SilverBox-Icon.png';
        break;
      case StoreItemTypeEnum.SILVERPACK:
        icon = 'https://predict.alswap.com/store/SilverChip-Icon.png';
        break;
      case StoreItemTypeEnum.GOLDPACK:
        icon = 'https://predict.alswap.com/store/GoldChip-Icon.png';
        break;
    }
    return this.storeItemRepository.save({ ...input, icon });
  }

  private async upsertItem(update: Partial<StoreItemEntity>): Promise<Partial<StoreItemEntity> | void> {
    try {
      const findRow = await this.storeItemRepository.findOneOrFail({ id: update.id });
      Object.assign(findRow, update);
      return await this.storeItemRepository.save(findRow);
    } catch (e) {
      try {
        return await this.storeItemRepository.save(update);
      } catch (e) {}
    }
  }

  updateItem(input: UpdateStoreItemDto): Promise<Partial<StoreItemEntity> | void> {
    return this.upsertItem(input);
  }

  async deleteItem(id: number): Promise<BaseResponseSchema> {
    const item = await this.storeItemRepository.find({ id });
    if (item) {
      const itemDeleted = await this.storeItemRepository.remove(item);
      if (itemDeleted) {
        return {
          message: 'Successfully Deleted!',
        };
      }
    }
    return {
      message: 'Unsuccessful! Something went wrong.',
    };
  }

  //TODO: add payment method
  async buyItem(user: UserEntity, id: number): Promise<BaseResponseSchema> {
    let updatedUser: Partial<UserEntity> = new UserEntity();
    const item = await this.storeItemRepository.findOneOrFail({ id });

    const neededGoldenChips = item.price_unit == StorePriceUnitEnum.USD ? 0 : item.price;
    if (neededGoldenChips > user.golden_chips) {
      throw new FlowException([
        {
          message: 'Do not have enough Golden Chips!',
          field: 'golden_chips',
          validation: 'not enough',
        },
      ]);
    }

    switch (item.type) {
      case StoreItemTypeEnum.GOLDPACK:
        updatedUser = { golden_chips: user.golden_chips + item.value - neededGoldenChips };
        break;
      case StoreItemTypeEnum.SILVERPACK:
        if (user.silver_chips_max - user.silver_chips < item.value) {
          throw new FlowException([
            {
              message: 'Do not have enough storage in Silver Box!',
              field: 'silver_chips',
              validation: 'not enough',
            },
          ]);
        }

        updatedUser = {
          silver_chips: user.silver_chips + item.value,
          golden_chips: user.golden_chips - neededGoldenChips,
        };
        break;
      case StoreItemTypeEnum.SILVERBOX:
        updatedUser = {
          silver_chips_max: user.silver_chips_max + item.value,
          golden_chips: user.golden_chips - neededGoldenChips,
        };
        break;
    }

    await this.usersService.updateUser({ id: user.id }, updatedUser);

    await this.storeBuyerRepository.save({ user_id: user.id, item });

    return {
      message: 'Successful!',
      userData: await this.usersService.findOne({ id: user.id }),
    };
  }
}
