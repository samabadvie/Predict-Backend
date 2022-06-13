import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadgesController } from './controllers/badges.controller';
import { BadgeEntity } from './entities/badges.entity';
import { BadgesService } from './services/badges.service';

@Module({
  imports: [TypeOrmModule.forFeature([BadgeEntity], 'mysql')],
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
