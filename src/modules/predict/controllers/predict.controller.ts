import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { BaseResponseSchema } from 'core/base-response.schema';
import { FlowException } from 'core/exceptions';
import { IReq } from 'core/interfaces';
import { ApiKeyAuthGuard } from 'modules/auth/guards/api-key.guard';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { IdDto } from 'modules/users/dtos/id.dto';
import { usernameDto } from 'modules/users/dtos/username.dto';
import { UsersService } from 'modules/users/services/users.services';
import { GetPredictsDto } from '../dtos/get-predicts.dto';
import { PostPredictDto } from '../dtos/post-predict.dto';
import { PredictDoneListSchema } from '../schemas/predict-done-list.schema';
import { PredictWaitingListSchema } from '../schemas/predict-waiting-list.schema';
import { PredictService } from '../services/predict.service';

@ApiTags('Predict')
@ApiSecurity('X-Api-Key')
@UseGuards(ApiKeyAuthGuard)
@Controller('Predict')
export class PredictController {
  constructor(private readonly predictService: PredictService, private readonly userService: UsersService) {}

  // @Get('test')
  // getTest(): Promise<BaseResponseSchema> {
  //   return this.predictService.test();
  // }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post('')
  addPrediction(
    @Req() req: IReq,
    @Body('') { value, symbol, time, point, direction }: PostPredictDto,
  ): Promise<BaseResponseSchema> {
    return this.predictService.addPrediction(req.user, value, symbol, time, point, direction, new Date(Date.now()));
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Delete('cancelPredict')
  deleteUser(@Req() req: IReq, @Query() { id }: IdDto): Promise<BaseResponseSchema> {
    return this.predictService.removePrediction(req.user, id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Get(':username/waitingPredicts')
  async getWaitingPredicts(
    @Req() req: IReq,
    @Param('') { username }: usernameDto,
    @Query() { page = 1, limit = 2000 }: GetPredictsDto,
  ): Promise<{ access: boolean; count: number; predicts: PredictWaitingListSchema[] }> {
    const user = await this.userService.findUserByUsername(username);
    let access = false;

    if (!user) {
      throw new FlowException([
        {
          message: 'Username does not exist!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }

    //for self
    if (req.user.id == user.id) {
      access = true;
    }
    //check access
    else if (await this.userService.hasAccess(req.user, user)) {
      access = true;
    } else {
      return {
        access,
        count: 0,
        predicts: [],
      };
    }
    const list = await this.predictService.getWaitingList(user, page, limit);
    return {
      access,
      count: list.count,
      predicts: list.predicts,
    };
  }

  @Get(':username/DonePredicts')
  async getDonePredicts(
    @Param('') { username }: usernameDto,
    @Query() { page = 1, limit = 2000, coin, status, time }: GetPredictsDto,
  ): Promise<{ count: number; predicts: PredictDoneListSchema[] }> {
    const user = await this.userService.findUserByUsername(username);

    if (!user) {
      throw new FlowException([
        {
          message: 'Username does not exist!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }

    return this.predictService.getDoneList(user, page, limit, coin, status, time);
  }
}
