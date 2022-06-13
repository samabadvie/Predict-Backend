import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'modules/auth/guards/admin.guard';
import { ApiKeyAuthGuard } from 'modules/auth/guards/api-key.guard';
import { IdDto } from 'modules/users/dtos/id.dto';
import { CreateUserLevelDto } from '../dtos/create-user-level.dto';
import { UpdateUserLevelDto } from '../dtos/update-user-level.dto';
import { UserLevelEntity } from '../entities/user-levels.entity';
import { UserLevelsListSchema } from '../schemas/user-levels-list.schema';
import { UserLevelsService } from '../services/user-levels.service';

@ApiTags('User Levels')
@ApiSecurity('X-Api-Key')
@UseGuards(ApiKeyAuthGuard)
@Controller('users-level')
export class UserLevelsController {
  constructor(private readonly userLevelsService: UserLevelsService) {}

  @Get('')
  findAll(): Promise<UserLevelEntity[]> {
    return this.userLevelsService.findAll();
  }

  @Get('list')
  getList(): Promise<UserLevelsListSchema[]> {
    return this.userLevelsService.getList();
  }

  @Get(':id')
  findOne(@Param('') { id }: IdDto): Promise<UserLevelEntity | undefined> {
    return this.userLevelsService.findWithId(id);
  }

  @ApiTags('Admin APIs')
  @ApiSecurity('bearer')
  @UseGuards(AdminGuard)
  @Post('')
  createOne(@Body() input: CreateUserLevelDto): Promise<UserLevelEntity> {
    return this.userLevelsService.createOne(input);
  }

  @ApiTags('Admin APIs')
  @ApiSecurity('bearer')
  @UseGuards(AdminGuard)
  @Patch('updateUserLevel')
  updateUserLevel(@Body() body: UpdateUserLevelDto): Promise<Partial<UserLevelEntity> | void> {
    return this.userLevelsService.updateUserLevel(body);
  }
}
