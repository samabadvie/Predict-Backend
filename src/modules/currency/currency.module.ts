import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'modules/users/users.module';
import { CurrencyController } from './controllers/currency.controller';
import { CurrencyEntity } from './entities/currencies.entity';
import { CurrencyService } from './services/currency.service';

@Module({
  imports: [TypeOrmModule.forFeature([CurrencyEntity], 'mysql'), forwardRef(() => UsersModule)],
  controllers: [CurrencyController],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
