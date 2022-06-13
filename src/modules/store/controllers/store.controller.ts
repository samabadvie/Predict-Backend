import { Body, Controller, Delete, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { BaseResponseSchema } from 'core/base-response.schema';
import { IReq } from 'core/interfaces';
import { AdminGuard } from 'modules/auth/guards/admin.guard';
import { ApiKeyAuthGuard } from 'modules/auth/guards/api-key.guard';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { IdDto } from 'modules/users/dtos/id.dto';
import { CreateStoreItemDto } from '../dtos/create-store-item.dto';
import { UpdateStoreItemDto } from '../dtos/update-store-item.dto';
import { StoreItemEntity } from '../entities/store-item.entity';
import { StoreService } from '../services/store.service';

@ApiSecurity('X-Api-Key')
@UseGuards(ApiKeyAuthGuard)
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @ApiTags('Store')
  @Get('list')
  findAll(): Promise<StoreItemEntity[]> {
    return this.storeService.findAll();
  }

  @ApiTags('Store')
  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post('buy')
  buyItem(@Req() req: IReq, @Query() { id }: IdDto): Promise<BaseResponseSchema> {
    return this.storeService.buyItem(req.user, id);
  }

  @ApiTags('Admin APIs')
  @ApiSecurity('bearer')
  @UseGuards(AdminGuard)
  @Post('')
  createOne(@Body() input: CreateStoreItemDto): Promise<StoreItemEntity> {
    return this.storeService.createOne(input);
  }

  @ApiTags('Admin APIs')
  @ApiSecurity('bearer')
  @UseGuards(AdminGuard)
  @Patch('updateItem')
  updateItem(@Body() body: UpdateStoreItemDto): Promise<Partial<StoreItemEntity> | void> {
    return this.storeService.updateItem(body);
  }

  @ApiTags('Admin APIs')
  @ApiSecurity('bearer')
  @UseGuards(AdminGuard)
  @Delete('item')
  deleteUser(@Query() { id }: IdDto): Promise<BaseResponseSchema> {
    return this.storeService.deleteItem(id);
  }
}
