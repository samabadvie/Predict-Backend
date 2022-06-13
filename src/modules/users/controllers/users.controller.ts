import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Delete,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../services/users.services';
import { IReq } from '../../../core/interfaces';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path, { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadResponseSchema } from '../schemas/upload-response.schema';
import { UploadDto } from '../dtos/upload.dto';
import { EmailDto } from '../dtos/email.dto';
import { OtpcodeDto } from '../dtos/otpcode.dto';
import { ConfirmOtpcodeResponseSchema } from '../schemas/confirm-otpcode-response.schema';
import { Query } from '@nestjs/common';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key.guard';
import { updateUsernameDto } from '../dtos/update-username.dto';
import { ConflictException, FlowException } from 'core/exceptions';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { compareSync } from 'bcrypt';
import { CurrencyService } from '../../currency/services/currency.service';
import { configService } from 'core/config.service';
import { AvatarsService } from '../../avatars/services/avatars.service';
import { UpdateAvatarDto } from '../dtos/update-avatar.dto';
import { BaseResponseSchema } from '../../../core/base-response.schema';
import { PlayingTimeDto } from '../dtos/playing-time.dto';
import { IdDto } from '../dtos/id.dto';
import { CoinService } from '../../coins/services/coin.service';
import { GetUserSchema } from '../schemas/get-user.schema';
import { UserEntity } from '../entities/user.entity';
import { BadgesService } from 'modules/badges/services/badges.service';
import { UserBadgeSchema } from '../schemas/user-badge.schema';
import { UsersJobService } from '../services/users-job.service';
import { unlinkSync } from 'fs';
import { FCMTokenDto } from '../dtos/fcm-token.dto';
import { NotificationHistoryService } from 'modules/notification/services/notification-history.service';
import { AccessRequestService } from 'modules/access-request/services/access-request.service';

@ApiTags('Users')
@ApiSecurity('X-Api-Key')
@UseGuards(ApiKeyAuthGuard)
@Controller('user')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => CurrencyService))
    private readonly currencyService: CurrencyService,
    @Inject(forwardRef(() => CoinService))
    private readonly coinService: CoinService,
    @Inject(forwardRef(() => AvatarsService))
    private readonly avatarsService: AvatarsService,
    private readonly badgesService: BadgesService,
    private readonly usersJobService: UsersJobService,

    @Inject(forwardRef(() => NotificationHistoryService))
    private readonly notificationHistoryService: NotificationHistoryService,
    @Inject(forwardRef(() => AccessRequestService))
    private readonly accessRequestService: AccessRequestService,
  ) {}

  @Post('testSilverChipsReward')
  testSilverChipsReward(@Query() { username }: updateUsernameDto): Promise<void> {
    return this.usersJobService.testSilverChipsReward(username, 10);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Get('')
  async getUser(@Req() req: IReq): Promise<GetUserSchema> {
    const user = await this.usersService.findUserRelation(req.user.username, 'user_level');

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
      prefer_currency: user?.prefer_currency,
      picture: user?.picture,
      email: user?.email,
      points: user?.points,
      available_points: user?.available_points,
      silver_chips: user?.silver_chips,
      silver_chips_max: user?.silver_chips_max,
      golden_chips: user?.golden_chips,
      referral_code: user?.referral_code,
      playing_time: user?.playing_time,
      default_coin: user?.default_coin,
      num_of_follower: (await this.usersService.followersList(user, 1, 2000)).length,
      num_of_following: (await this.usersService.followingList(user, 1, 2000)).length,
      user_level_name: user?.user_level.name,
      user_level_icon: user?.user_level.icon,
      corrects: user?.total_wins,
      total_predicts: user?.total_predicts,
      win_streaks: user?.max_win_streaks,
      score: user?.score,
      last_notification_time: await this.notificationHistoryService.getLastNotificationTime(user.username),
      last_access_request_time: await this.accessRequestService.getLastAccessRequestTime(user),
    };
  }

  @Get('userBadge')
  async getUserBadge(@Query() { username }: updateUsernameDto): Promise<UserBadgeSchema[]> {
    const result: UserBadgeSchema[] = [];
    const user = await this.usersService.findUserByUsername(username);
    const badges = await this.badgesService.getList();

    badges.forEach((badge) => {
      const tmpResult: UserBadgeSchema = {
        badge_id: badge.id,
        badge_name: badge.name,
        icon: badge.icon,
      };
      switch (badge.name) {
        case 'Total Wins':
          tmpResult.level = user?.total_wins_level;
          result.push(tmpResult);
          break;
        case 'Win Streaks':
          tmpResult.level = user?.win_streaks_level;
          result.push(tmpResult);
          break;
        case 'Btc Win Streaks':
          tmpResult.level = user?.btc_win_streaks_level;
          result.push(tmpResult);
          break;
        case 'Eth Win Streaks':
          tmpResult.level = user?.eth_streaks_level;
          result.push(tmpResult);
          break;
        case 'Altcoins Win Streaks':
          tmpResult.level = user?.altcoins_win_streaks_level;
          result.push(tmpResult);
          break;
        case 'Points':
          tmpResult.level = user?.point_level;
          result.push(tmpResult);
          break;
      }
    });

    if (!user) {
      throw new FlowException([
        {
          message: 'Username does not exist!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }
    return result;
  }

  @Get('userLevel')
  async getUserLevel(@Query() { username }: updateUsernameDto): Promise<Partial<UserEntity>> {
    const user = await this.usersService.findUserRelation(username, 'user_level');

    return {
      user_level: user.user_level,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Patch('updatePreferCurrency')
  async updatePreferCurrency(@Req() req: IReq, @Body() { id }: IdDto): Promise<BaseResponseSchema> {
    const currency = await this.currencyService.findOne({ id });
    const updateResult = await this.usersService.updateUser({ id: req.user.id }, { prefer_currency: currency?.value });
    if (updateResult.affected) {
      return {
        message: 'Successfully updated!',
        userData: await this.usersService.findUserById(req.user.id),
      };
    }
    return {
      message: 'Unsuccessful! Something went wrong.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Patch('updateDefaultCoin')
  async updateDefaultCoin(@Req() req: IReq, @Body() { id }: IdDto): Promise<BaseResponseSchema> {
    const coin = await this.coinService.findOne({ id });
    const updateResult = await this.usersService.updateUser({ id: req.user.id }, { default_coin: coin?.symbol });
    if (updateResult.affected) {
      return {
        message: 'Successfully updated!',
        userData: await this.usersService.findUserById(req.user.id),
      };
    }
    return {
      message: 'Unsuccessful! Something went wrong.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Patch('updateRandomAvatar')
  async updateRandomAvatar(@Req() req: IReq, @Body() { id }: UpdateAvatarDto): Promise<BaseResponseSchema> {
    const avatar = await this.avatarsService.findOne({ id });
    const updateResult = await this.usersService.updateUser({ id: req.user.id }, { picture: avatar?.path });
    if (updateResult.affected) {
      return {
        message: 'Successfully updated!',
        userData: await this.usersService.findUserById(req.user.id),
      };
    }
    return {
      message: 'Unsuccessful! Something went wrong.',
    };
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to be uploaded',
    type: UploadDto,
  })
  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post('uploadProfileImage')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './././assets/profile-images',
        filename: ({}, file, cb) => {
          const filename: string = uuidv4();
          const extension: string = path.parse(file.originalname).ext;
          cb(null, `${filename}${extension}`);
        },
      }),
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req: IReq): Promise<UploadResponseSchema> {
    await this.usersService.uploadUserImage(
      req.user.id,
      'https://' + configService.getAppBaseUrl() + '/profile-images/' + file.filename,
    );

    if (req.user.picture) {
      unlinkSync(join(__dirname, '../../../..', 'assets/profile-images/' + path.basename(req.user.picture)));
    }

    return {
      name: file.filename,
      path: 'https://' + configService.getAppBaseUrl() + '/profile-images/' + file.filename,
      userData: await this.usersService.findUserById(req.user.id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Get('sendEmailVerificationCode')
  sendEmailVerificationCode(@Req() req: IReq, @Query() { email }: EmailDto): Promise<BaseResponseSchema> {
    return this.usersService.sendEmailVerificationCode(req.user.username, req.user.id, email);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post('confirmEmailOtpCode')
  confirmEmailOtpCode(@Req() req: IReq, @Body() { otpcode }: OtpcodeDto): Promise<ConfirmOtpcodeResponseSchema> {
    return this.usersService.confirmEmailOtpCode(req.user.id, otpcode);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Patch('updateUsername')
  async updateUsername(@Req() req: IReq, @Body() { username }: updateUsernameDto): Promise<BaseResponseSchema> {
    const existUser = await this.usersService.findOne({ username });
    if (existUser) {
      throw new ConflictException([
        {
          message: 'Username is already used!',
          field: 'username',
          validation: 'conflict',
        },
      ]);
    }
    const updateResult = await this.usersService.updateUser({ id: req.user.id }, { username });
    if (updateResult.affected) {
      return {
        message: 'Successfully updated!',
        userData: await this.usersService.findUserById(req.user.id),
      };
    }
    return {
      message: 'Unsuccessful! Something went wrong.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Patch('changePassword')
  async changePassword(
    @Req() req: IReq,
    @Body() { current_pass, new_pass, confirm_new_pass }: ChangePasswordDto,
  ): Promise<BaseResponseSchema> {
    if (new_pass != confirm_new_pass) {
      throw new ConflictException([
        {
          message: 'The passwords do NOT match!',
          field: 'confirm_password',
          validation: 'conflict',
        },
      ]);
    }

    const user = await this.usersService.findOne({ id: req.user.id });
    if (user && compareSync(current_pass, user?.password_hash || '')) {
      await this.usersService.updatePassword(req.user.id, new_pass);
      return {
        message: 'Password changed successfully.',
      };
    }

    throw new ConflictException([
      {
        message: 'Current password is incorrect!',
        field: 'current_pass',
        validation: 'wrong',
      },
    ]);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Delete('deleteAccount')
  deleteUser(@Req() req: IReq): Promise<BaseResponseSchema> {
    return this.usersService.deleteUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post('playingTime')
  playingTime(@Req() req: IReq, @Body() { start }: PlayingTimeDto): Promise<BaseResponseSchema> {
    return this.usersService.updatePlayingTime(req.user.id, Date.now(), start);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post('fcmToken')
  fcmToken(@Req() req: IReq, @Body() { fcm_token }: FCMTokenDto): Promise<BaseResponseSchema> {
    return this.usersService.updateFCMToken(req.user.id, fcm_token);
  }
}
