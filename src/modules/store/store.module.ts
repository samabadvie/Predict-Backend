import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'modules/users/users.module';
import { StoreController } from './controllers/store.controller';
import { StoreBuyersEntity } from './entities/store-buyers.entity';
import { StoreItemEntity } from './entities/store-item.entity';
import { StoreService } from './services/store.service';

@Module({
  imports: [TypeOrmModule.forFeature([StoreItemEntity, StoreBuyersEntity], 'mysql'), forwardRef(() => UsersModule)],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
