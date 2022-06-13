import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'modules/auth/guards/admin.guard';
import { ApiKeyAuthGuard } from 'modules/auth/guards/api-key.guard';
import { IdDto } from 'modules/users/dtos/id.dto';
import { CreateBadgeDto } from '../dtos/create-badge.dto';
import { UpdateBadgeDto } from '../dtos/update-badge.dto';
import { BadgeEntity } from '../entities/badges.entity';
import { BadgesListSchema } from '../schemas/badges-list.schema';
import { BadgesService } from '../services/badges.service';

@ApiTags('Badges')
@ApiSecurity('X-Api-Key')
@UseGuards(ApiKeyAuthGuard)
@Controller('badge')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get('')
  findAll(): Promise<BadgeEntity[]> {
    return this.badgesService.findAll();
  }

  @Get('list')
  getList(): Promise<BadgesListSchema[]> {
    return this.badgesService.getList();
  }

  @Get(':id')
  findOne(@Param('') { id }: IdDto): Promise<BadgeEntity | undefined> {
    return this.badgesService.findWithId(id);
  }

  @ApiTags('Admin APIs')
  @ApiSecurity('bearer')
  @UseGuards(AdminGuard)
  @Post('')
  createOne(@Body() input: CreateBadgeDto): Promise<BadgeEntity> {
    return this.badgesService.createOne(input);
  }

  @ApiTags('Admin APIs')
  @ApiSecurity('bearer')
  @UseGuards(AdminGuard)
  @Patch('updateBadge')
  updateBadge(@Body() body: UpdateBadgeDto): Promise<Partial<BadgeEntity> | void> {
    return this.badgesService.updateBadges(body);
  }
}
