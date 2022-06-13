import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictModule } from 'modules/predict/predict.module';
import { UsersModule } from 'modules/users/users.module';
import { AdminsController } from './controllers/admins.controlles';
import { AdminEntity } from './entities/admin.entity';
import { AdminsService } from './services/admins.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminEntity], 'mysql'),
    forwardRef(() => UsersModule),
    forwardRef(() => PredictModule),
  ],
  controllers: [AdminsController],
  providers: [AdminsService],
  exports: [AdminsService],
})
export class AdminsModule {}
