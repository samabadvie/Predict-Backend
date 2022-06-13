import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'modules/users/users.module';
import { UserLevelsController } from './controllers/user-levels.controller';
import { UserLevelEntity } from './entities/user-levels.entity';
import { UserLevelsService } from './services/user-levels.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserLevelEntity], 'mysql'), forwardRef(() => UsersModule)],
  controllers: [UserLevelsController],
  providers: [UserLevelsService],
  exports: [UserLevelsService],
})
export class UserLevelsModule {}
