import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvatarEntity } from './entities/avatar.entity';
import { AvatarsController } from './controllers/avatars.controller';
import { AvatarsService } from './services/avatars.service';

@Module({
  imports: [TypeOrmModule.forFeature([AvatarEntity], 'mysql')],
  controllers: [AvatarsController],
  providers: [AvatarsService],
  exports: [AvatarsService],
})
export class AvatarsModule {}
