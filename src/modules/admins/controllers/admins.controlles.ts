import { Controller, forwardRef, Get, Inject, Post, Query, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { BaseResponseSchema } from 'core/base-response.schema';
import { CountSchema } from 'core/count.schema';
import { AdminGuard } from 'modules/auth/guards/admin.guard';
import { ApiKeyAuthGuard } from 'modules/auth/guards/api-key.guard';
import { PredictService } from 'modules/predict/services/predict.service';
import { ActiveUsersCountSchema } from 'modules/users/schemas/active-users-count.schema';
import { PredictCountSchema } from 'modules/users/schemas/predict-count.schema';
import { UsersService } from 'modules/users/services/users.services';
import { AssignUserChipsDto } from '../dtos/assign-user-chips.dto';
import { AssignUserLevelDto } from '../dtos/assign-user-level.dto';
import { AssignUserPointDto } from '../dtos/assign-user-point.dto';
import { GetPredictCountDto } from '../dtos/get-predict-count.dto';

@ApiTags('Admin APIs')
@ApiSecurity('X-Api-Key')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('bearer')
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminsController {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => PredictService))
    private readonly predictService: PredictService,
  ) {}

  /**
   * Assign User-Level to user with username and id of level (from admin)
   *
   * @returns BaseResponseSchema
   */

  @Post('assignUserLevel')
  assignUserLevel(@Query('') { username, levelId }: AssignUserLevelDto): Promise<BaseResponseSchema> {
    return this.usersService.assignUserLevel(username, levelId);
  }

  /**
   * Assign point to user with username (from admin)
   *
   * @returns BaseResponseSchema
   */

  @Post('assignUserPoint')
  assignUserPoint(@Query('') { username, point }: AssignUserPointDto): Promise<BaseResponseSchema> {
    return this.usersService.assignUserPoint(username, point);
  }

  /**
   * Assign silver_chips & golden_chips to user with username (from admin)
   *
   * @returns BaseResponseSchema
   */

  @Post('assignUserChips')
  assignUserChips(
    @Query('') { username, silver_chips, golden_chips }: AssignUserChipsDto,
  ): Promise<BaseResponseSchema> {
    return this.usersService.assignUserChips(username, silver_chips, golden_chips);
  }

  /**
   * Get Active Users Count in daily, weekly and monthly (from admin)
   *
   * @returns ActiveUsersCountSchema
   */

  @Get('activeUsersCount')
  activeUsersCount(): Promise<ActiveUsersCountSchema> {
    return this.usersService.getActiveUsersCount();
  }

  /**
   * Get Referred Users Count (from admin)
   *
   * @returns CountSchema
   */

  @Get('referredUsersCount')
  referredUsersCount(): Promise<CountSchema> {
    return this.usersService.getReferredUsersCount();
  }

  /**
   * Get Referred Users Count (from admin)
   *
   * @returns PredictCountSchema
   */

  @Get('predictCount')
  predictCount(@Query('') { symbol }: GetPredictCountDto): Promise<PredictCountSchema> {
    return this.predictService.getPredictCount(symbol);
  }
}
