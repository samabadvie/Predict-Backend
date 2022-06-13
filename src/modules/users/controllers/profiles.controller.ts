import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../services/users.services';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key.guard';
import { usernameDto, usernameListDto } from '../dtos/username.dto';
import { FlowException } from '../../../core/exceptions';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { IReq } from 'core/interfaces';
import { UsersListSchema } from '../schemas/users-list.schema';
import { BaseResponseSchema } from '../../../core/base-response.schema';
import { UserSortByTimeEnum } from '../enums/user-sort-by-time.enum';
import { UserSortByTypeEnum } from '../enums/user-sort-by-type.enum';
import { GetRankingDto } from '../dtos/get-ranking.dto';
import { GetUserListDto } from '../dtos/get-user-list.dto';
import { GetUserSchema } from '../schemas/get-user.schema';

@ApiTags('Profiles')
@ApiSecurity('X-Api-Key')
@UseGuards(ApiKeyAuthGuard)
@Controller('Profiles')
export class ProfilesController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Get('')
  getUsers(
    @Req() req: IReq,
    @Query()
    { page = 1, limit = 2000, time = UserSortByTimeEnum.ALLTIME, type = UserSortByTypeEnum.ALL, q }: GetRankingDto,
  ): Promise<{ userList: UsersListSchema[]; myRank: number } | []> {
    return this.usersService.userList(req.user, page, limit, time, type, q);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Get('/:username')
  async findProfile(@Param('') { username }: usernameDto, @Req() req: IReq): Promise<GetUserSchema> {
    const user = await this.usersService.findUserRelation(username, 'user_level');

    const followers = await this.usersService.followersList(user, 1, 2000);
    const followings = await this.usersService.followingList(user, 1, 2000);

    if (!user) {
      throw new FlowException([
        {
          message: 'User not found!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }

    return {
      id: user?.id,
      username: user?.username,
      picture: user?.picture,
      points: user?.points,
      available_points: user?.available_points,
      num_of_follower: followers.length,
      num_of_following: followings.length,
      user_level_name: user?.user_level.name,
      user_level_icon: user?.user_level.icon,
      playing_time: user?.playing_time,
      corrects: user?.total_wins,
      total_predicts: user?.total_predicts,
      win_streaks: user?.max_win_streaks,
      score: user?.score,
      access_request_enable: user?.user_level.access_request_enable,
      user_is_following: !!followers.find((f) => f.username === req.user.username),
      other_is_following: !!followings.find((f) => f.username === req.user.username),
    };
  }

  @Get('/:username/followers')
  async getFollowers(
    @Param('') { username }: usernameDto,
    @Query() { page = 1, limit = 2000, q }: GetUserListDto,
  ): Promise<UsersListSchema[]> {
    const user = await this.usersService.findUserByUsername(username);
    if (!user) {
      throw new FlowException([
        {
          message: 'User not found!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }
    return this.usersService.followersList(user, page, limit, q);
  }

  @Get('/:username/following')
  async getFollowing(
    @Param('') { username }: usernameDto,
    @Query() { page = 1, limit = 2000, q }: GetUserListDto,
  ): Promise<UsersListSchema[]> {
    const user = await this.usersService.findUserByUsername(username);
    if (!user) {
      throw new FlowException([
        {
          message: 'User not found!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }
    return this.usersService.followingList(user, page, limit, q);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post('/:username/follow')
  async followUser(@Req() req: IReq, @Param('') { username }: usernameDto): Promise<BaseResponseSchema> {
    const result = await this.usersService.followUser(req.user, username);
    result.userFollowings = await this.getFollowing({ username: req.user.username }, { page: 1, limit: 2000 });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post('/:username/unfollow')
  async unFollowUser(@Req() req: IReq, @Param('') { username }: usernameDto): Promise<BaseResponseSchema> {
    const result = await this.usersService.unFollowUser(req.user, username);
    result.userFollowings = await this.getFollowing({ username: req.user.username }, { page: 1, limit: 2000 });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post('block')
  async blockUser(@Req() req: IReq, @Body() { username }: usernameDto): Promise<BaseResponseSchema> {
    const result = await this.usersService.blockUser(req.user, username);
    result.userBlocks = await this.getBlocksUser({ username: req.user.username }, { page: 1, limit: 2000 });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post('unblock')
  async unblockUser(@Req() req: IReq, @Body() { username }: usernameDto): Promise<BaseResponseSchema> {
    const result = await this.usersService.unblockUser(req.user, username);
    result.userBlocks = await this.getBlocksUser({ username: req.user.username }, { page: 1, limit: 2000 });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post('unblockList')
  async unblockList(@Req() req: IReq, @Body() { username_list }: usernameListDto): Promise<BaseResponseSchema> {
    const result = await this.usersService.unblockList(req.user, username_list);
    return result;
  }

  @Get('/:username/blockUsers')
  async getBlocksUser(
    @Param('') { username }: usernameDto,
    @Query() { page = 1, limit = 2000, q }: GetUserListDto,
  ): Promise<UsersListSchema[] | []> {
    const user = await this.usersService.findUserByUsername(username);
    if (!user) {
      throw new FlowException([
        {
          message: 'User not found!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }
    return this.usersService.getBlockUsers(user, page, limit, q);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post('accessList')
  getAccessList(
    @Req() req: IReq,
    @Query() { page = 1, limit = 2000 }: GetUserListDto,
  ): Promise<UsersListSchema[] | []> {
    return this.usersService.getAccessList(req.user, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post('accessToList')
  getAccessToList(
    @Req() req: IReq,
    @Query() { page = 1, limit = 2000 }: GetUserListDto,
  ): Promise<UsersListSchema[] | []> {
    return this.usersService.getAccessToList(req.user, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Patch(':username/removeAccess')
  async removeAccess(@Req() req: IReq, @Param('') { username }: usernameDto): Promise<BaseResponseSchema> {
    const result = await this.usersService.removeAccess(req.user, username);
    result.userAccess = await this.usersService.getAccessList(req.user, 1, 2000);

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post('removeAccessList')
  async removeAccessList(@Req() req: IReq, @Body() { username_list }: usernameListDto): Promise<BaseResponseSchema> {
    const result = await this.usersService.removeAccessList(req.user, username_list);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post('removeAccessToList')
  async removeAccessToList(@Req() req: IReq, @Body() { username_list }: usernameListDto): Promise<BaseResponseSchema> {
    const result = await this.usersService.removeAccessToList(req.user, username_list);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post('/:username/sendGoldChip')
  sendGoldChip(@Req() req: IReq, @Param('') { username }: usernameDto): Promise<BaseResponseSchema> {
    return this.usersService.sendGoldChip(req.user, username);
  }
}
