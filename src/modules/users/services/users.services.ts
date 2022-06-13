import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { ConflictException } from '../../../core/exceptions';
import { ConfirmEmailEnum } from '../../../core/confirm-email.enum';
import { ConfirmOtpcodeResponseSchema } from '../schemas/confirm-otpcode-response.schema';
import { otpCodeGenerator } from '../../../core/utils';
import { EmailService } from '../../email/services/email.service';
import { FlowException } from 'core/exceptions';
import { hashSync } from 'bcrypt';
import { BaseResponseSchema } from '../../../core/base-response.schema';
import { UsersListSchema } from '../schemas/users-list.schema';
import { OtpCodesEntity } from '../entities/otpcode.entity';
import { LoginEntity } from '../entities/login.entity';
import { UserSortByTypeEnum } from '../enums/user-sort-by-type.enum';
import { FollowingUserSchema } from '../schemas/following-user.schema';
import { FollowersUserSchema } from '../schemas/followers-user.schema';
import { BlocksUserSchema } from '../schemas/blocks-user.schema';
import { BlocksByUserSchema } from '../schemas/blocks-by-user.schema';
import { UserLevelsService } from 'modules/user-level/services/user-levels.service';
import { NotificationService } from './notification.service';
import { NotificationEntity } from '../entities/notification.entity';
import { PointService } from 'modules/predict/services/points.service';
import { UserSortByTimeEnum } from '../enums/user-sort-by-time.enum';
import { AllowedUserSchema } from '../schemas/allowed-user.schema';
import { ActiveUsersCountSchema } from '../schemas/active-users-count.schema';
import { CountSchema } from 'core/count.schema';
import { AllowedByUserSchema } from '../schemas/allowed-by-user.schema';
import { QueueProducer } from '../producers/queue.producer';
import { FCMNotificationService } from 'modules/notification/services/fcm-notification.service';
import { UpdateTypesEnum } from '../enums/update-types.enum';
import { NotificationType } from 'modules/notification/enums/notification-type.enum';
import { usernameDto } from '../dtos/username.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity, 'mysql')
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(OtpCodesEntity, 'mysql')
    private readonly OtpCodesRepository: Repository<OtpCodesEntity>,

    @InjectRepository(LoginEntity, 'mysql')
    private readonly loginRepository: Repository<LoginEntity>,

    @Inject(forwardRef(() => EmailService))
    private readonly emailService: EmailService,

    @Inject(forwardRef(() => UserLevelsService))
    private readonly userLevelService: UserLevelsService,

    @Inject(forwardRef(() => PointService))
    private readonly pointService: PointService,

    private readonly notificationService: NotificationService,

    public readonly queueProducer: QueueProducer,

    @Inject(forwardRef(() => FCMNotificationService))
    private readonly fcmNotificationService: FCMNotificationService,
  ) {}

  async saveUser(input: Partial<UserEntity>, referral_code?: string): Promise<UserEntity | void> {
    const user = await this.userRepository.findOne({ username: input.username, email_verified: true });

    //TODO: change to dynamic
    input.user_level = await this.userLevelService.findWithId(1);

    if (user)
      throw new ConflictException([
        {
          message: 'Username is already used!',
          field: 'username',
          validation: 'conflict',
        },
      ]);

    if (referral_code) {
      const referredUser = await this.userRepository.findOne({ referral_code });
      if (!referredUser) {
        throw new ConflictException([
          {
            message: 'The referral code is NOT valid!',
            field: 'referral code',
            validation: 'wrong',
          },
        ]);
      }
      input.refer_by = referredUser.id;
    }

    const userNotVerified = await this.userRepository.findOne({ username: input.username, email_verified: false });
    if (!userNotVerified) {
      return this.userRepository.save(input);
    }

    await this.userRepository.update({ username: userNotVerified.username }, input);
  }

  findAll(): Promise<UserEntity[]> {
    return this.userRepository.find();
  }

  findAllWithScoreOrder(): Promise<UserEntity[]> {
    return this.userRepository.find({
      order: {
        score: 'DESC',
        created_at: 'ASC',
      },
    });
  }

  findOne(input: Partial<UserEntity>): Promise<UserEntity | undefined> {
    return this.userRepository.findOne(input);
  }

  findOtpcode(input: Partial<OtpCodesEntity>): Promise<OtpCodesEntity | undefined> {
    return this.OtpCodesRepository.findOne(input);
  }

  findUserById(id: number): Promise<UserEntity | undefined> {
    return this.userRepository.findOne({ id });
  }

  findUserByUsername(username: string): Promise<UserEntity | undefined> {
    return this.userRepository.findOne({ username });
  }

  updateUser(input: Partial<UserEntity>, update: Partial<UserEntity>): Promise<UpdateResult> {
    return this.userRepository.update(input, update);
  }

  uploadUserImage(id: number, picture: string): Promise<UpdateResult> {
    return this.updateUser({ id }, { picture });
  }

  async sendEmailVerificationCode(username: string, user_id: number, email: string): Promise<BaseResponseSchema> {
    const result: BaseResponseSchema = { message: 'Sending email failed.' };

    const otpcode = otpCodeGenerator();
    await this.OtpCodesRepository.save({
      user_id,
      email,
      otpcode,
      otpValidDate: new Date(new Date().getTime() + 5 * 60 * 1000),
    });

    const emailResult = await this.emailService.sendMail(
      {
        to: email,
        subject: 'Predict App: Email Verification Code',
      },
      {
        title: 'Email Verification Code',
        body: `<p>Your username: ${username}</p><p></p>
              <p>your code: ${otpcode}</p><p>This code validate until 5 minutes.</p>`,
      },
    );

    if (emailResult.id) {
      result.message = 'Email sent successfully.';
    }

    return result;
  }

  async confirmEmailOtpCode(user_id: number, otpcode: string): Promise<ConfirmOtpcodeResponseSchema> {
    const result: ConfirmOtpcodeResponseSchema = new ConfirmOtpcodeResponseSchema();
    const otpEntity = await this.OtpCodesRepository.findOne({ user_id, otpcode });

    if (!otpEntity) {
      throw new FlowException([
        {
          message: ConfirmEmailEnum.FAIL,
          field: 'otpcode',
          validation: 'conflict',
        },
      ]);
    } else {
      const validateOtpDate: Date = otpEntity ? otpEntity.otpValidDate : new Date();
      if (Date.now() > validateOtpDate.getTime()) {
        throw new FlowException([
          {
            message: ConfirmEmailEnum.TIMEOUT,
            field: 'otpcode',
            validation: 'conflict',
          },
        ]);
      }
      result.message = ConfirmEmailEnum.SUCCESS;

      const notification = await this.notificationService.findOneWithUserId(user_id);

      await this.updateUser(
        { id: user_id },
        {
          email: otpEntity.email,
          email_verified: true,
          notification: notification || new NotificationEntity(await this.notificationService.create({ user_id })),
        },
      );
      result.userData = await this.findUserById(user_id);
      await this.OtpCodesRepository.remove(otpEntity);
    }

    return result;
  }

  async updatePassword(id: number, password: string): Promise<void> {
    const password_hash = hashSync(password, 10);

    await this.updateUser({ id }, { password_hash });
  }

  async deleteUser(id: number): Promise<BaseResponseSchema> {
    const user = await this.findUserById(id);
    if (user) {
      const userDeleted = await this.userRepository.remove(user);
      if (userDeleted) {
        return {
          message: 'Successfully Deleted!',
        };
      }
    }
    return {
      message: 'Unsuccessful! Something went wrong.',
    };
  }

  async followersList(user: UserEntity, page: number, limit: number, q?: string): Promise<UsersListSchema[] | []> {
    const result: UsersListSchema[] = [];
    const blocksUser = await this.getBlockUsers(user, 1, 3000, undefined);
    const blocksByUser = await this.getBlockByUsers(user, 1, 3000);

    const accessRequestUserLevelEnables = await this.userLevelService.find({ access_request_enable: true });
    const accessRequestUserLevelIds = accessRequestUserLevelEnables.map((item) => item.id);

    let followers: FollowersUserSchema[] = [];
    if (q) {
      followers = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.followers', 'followers')
        .where('user.id = :id', { id: user.id })
        .select(['followers'])
        .andWhere('followers.username LIKE :q', { q: `%${q}%` })
        .limit(limit)
        .offset((page - 1) * limit)
        .execute();
    } else {
      followers = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.followers', 'followers')
        .where('user.id = :id', { id: user.id })
        .select(['followers'])
        .limit(limit)
        .offset((page - 1) * limit)
        .execute();
    }

    if (followers.length == 0) {
      return [];
    }

    followers.forEach((element) => {
      result.push({
        username: element.followers_username,
        points: element.followers_points,
        picture: element.followers_picture,
        access_request_enable: accessRequestUserLevelIds.includes(element.followers_userLevelId),
        block: blocksUser.some((userElement) => {
          return (
            JSON.stringify({
              username: element.followers_username,
              points: element.followers_points,
              picture: element.followers_picture,
            }) === JSON.stringify(userElement)
          );
        }),
        block_by: blocksByUser.some((userElement) => {
          return (
            JSON.stringify({
              username: element.followers_username,
              points: element.followers_points,
              picture: element.followers_picture,
            }) === JSON.stringify(userElement)
          );
        }),
      });
    });

    if (result.length == 0) {
      return [];
    }

    if (result[0].username == null) {
      return [];
    }

    return result;
  }

  async followingList(user: UserEntity, page: number, limit: number, q?: string): Promise<UsersListSchema[] | []> {
    const result: UsersListSchema[] = [];

    const blocksUser = await this.getBlockUsers(user, 1, 3000, undefined);
    const blocksByUser = await this.getBlockByUsers(user, 1, 3000);

    const accessRequestUserLevelEnables = await this.userLevelService.find({ access_request_enable: true });
    const accessRequestUserLevelIds = accessRequestUserLevelEnables.map((item) => item.id);

    let following: FollowingUserSchema[] = [];

    if (q) {
      following = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.following', 'following')
        .where('user.id = :id', { id: user.id })
        .select(['following'])
        .andWhere('following.username LIKE :q', { q: `%${q}%` })
        .limit(limit)
        .offset((page - 1) * limit)
        .execute();
    } else {
      following = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.following', 'following')
        .where('user.id = :id', { id: user.id })
        .select(['following'])
        .limit(limit)
        .offset((page - 1) * limit)
        .execute();
    }

    if (following.length == 0) {
      return [];
    }

    following.forEach((element) => {
      result.push({
        username: element.following_username,
        points: element.following_points,
        picture: element.following_picture,
        access_request_enable: accessRequestUserLevelIds.includes(element.following_userLevelId),
        block: blocksUser.some((userElement) => {
          return (
            JSON.stringify({
              username: element.following_username,
              points: element.following_points,
              picture: element.following_picture,
            }) === JSON.stringify(userElement)
          );
        }),
        block_by: blocksByUser.some((userElement) => {
          return (
            JSON.stringify({
              username: element.following_username,
              points: element.following_points,
              picture: element.following_picture,
            }) === JSON.stringify(userElement)
          );
        }),
      });
    });

    if (result.length == 0) {
      return [];
    }

    if (result[0].username == null) {
      return [];
    }

    return result;
  }

  async userList(
    user: UserEntity,
    page: number,
    limit: number,
    time?: string,
    type?: string,
    q?: string,
  ): Promise<{ userList: UsersListSchema[]; myRank: number } | []> {
    let rankNumber = 1;
    const result: UsersListSchema[] = [];

    const blocksUser = await this.getBlockUsers(user, 1, 3000, undefined);
    const blocksByUser = await this.getBlockByUsers(user, 1, 3000);

    const rankingEntity = await this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.points', 'DESC')
      .addOrderBy('user.id', 'ASC')
      .getMany();

    const ranking: { username: string; rank: number }[] = [];

    rankingEntity.forEach((user) => {
      ranking.push({
        username: user.username,
        rank: rankNumber++,
      });
    });

    const myRank = ranking.find((x) => x.username == user.username);

    if (type == UserSortByTypeEnum.ALL && time != UserSortByTimeEnum.ALLTIME) {
      let days = 1;
      switch (time) {
        case UserSortByTimeEnum.DAILY:
          days = 1;
          break;
        case UserSortByTimeEnum.WEEKLY:
          days = 7;
          break;
        case UserSortByTimeEnum.MONTHLY:
          days = 30;
          break;
      }
      return this.pointService.getTopTwenty(days, page, limit, user.username, q);
    }

    if (type == UserSortByTypeEnum.FOLLOWERS) {
      let followers: FollowersUserSchema[] = [];
      if (q) {
        followers = await this.userRepository
          .createQueryBuilder('user')
          .leftJoinAndSelect('user.followers', 'followers')
          .orderBy('followers.points', 'DESC')
          .addOrderBy('followers.id', 'ASC')
          .where('user.id = :id', { id: user.id })
          .select(['followers'])
          .andWhere('followers.username LIKE :q', { q: `%${q}%` })
          .limit(limit)
          .offset((page - 1) * limit)
          .execute();
      } else {
        followers = await this.userRepository
          .createQueryBuilder('user')
          .leftJoinAndSelect('user.followers', 'followers')
          .orderBy('followers.points', 'DESC')
          .addOrderBy('followers.id', 'ASC')
          .where('user.id = :id', { id: user.id })
          .select(['followers'])
          .limit(limit)
          .offset((page - 1) * limit)
          .execute();
      }

      if (followers.length == 0) {
        return {
          userList: [],
          myRank: myRank ? myRank.rank : 0,
        };
      }

      followers.forEach((element) => {
        result.push({
          rank: ranking.find((x) => x.username == element.followers_username)?.rank,
          username: element.followers_username,
          points: element.followers_points,
          picture: element.followers_picture,
          block: blocksUser.some((userElement) => {
            return (
              JSON.stringify({
                username: element.followers_username,
                points: element.followers_points,
                picture: element.followers_picture,
              }) === JSON.stringify(userElement)
            );
          }),
          block_by: blocksByUser.some((userElement) => {
            return (
              JSON.stringify({
                username: element.followers_username,
                points: element.followers_points,
                picture: element.followers_picture,
              }) === JSON.stringify(userElement)
            );
          }),
        });
      });
    } else if (type == UserSortByTypeEnum.FOLLOWING) {
      let following: FollowingUserSchema[] = [];

      if (q) {
        following = await this.userRepository
          .createQueryBuilder('user')
          .leftJoinAndSelect('user.following', 'following')
          .orderBy('following.points', 'DESC')
          .addOrderBy('following.id', 'ASC')
          .where('user.id = :id', { id: user.id })
          .select(['following'])
          .andWhere('following.username LIKE :q', { q: `%${q}%` })
          .limit(limit)
          .offset((page - 1) * limit)
          .execute();
      } else {
        following = await this.userRepository
          .createQueryBuilder('user')
          .leftJoinAndSelect('user.following', 'following')
          .orderBy('following.points', 'DESC')
          .addOrderBy('following.id', 'ASC')
          .where('user.id = :id', { id: user.id })
          .select(['following'])
          .limit(limit)
          .offset((page - 1) * limit)
          .execute();
      }

      if (following.length == 0) {
        return {
          userList: [],
          myRank: myRank ? myRank.rank : 0,
        };
      }

      following.forEach((element) => {
        result.push({
          rank: ranking.find((x) => x.username == element.following_username)?.rank,
          username: element.following_username,
          points: element.following_points,
          picture: element.following_picture,
          block: blocksUser.some((userElement) => {
            return (
              JSON.stringify({
                username: element.following_username,
                points: element.following_points,
                picture: element.following_picture,
              }) === JSON.stringify(userElement)
            );
          }),
          block_by: blocksByUser.some((userElement) => {
            return (
              JSON.stringify({
                username: element.following_username,
                points: element.following_points,
                picture: element.following_picture,
              }) === JSON.stringify(userElement)
            );
          }),
        });
      });
    } else if (type == UserSortByTypeEnum.ALL) {
      let output: UserEntity[] = [];

      const queryBuilder = this.userRepository.createQueryBuilder('query');
      queryBuilder.orderBy('query.points', 'DESC');
      queryBuilder.addOrderBy('query.id', 'ASC');

      if (q) {
        queryBuilder.where('username LIKE :q', { q: `%${q}%` });
      }

      if (page && limit) {
        output = await queryBuilder
          .take(limit)
          .skip((page - 1) * limit)
          .getMany();
      }

      output.forEach((element) => {
        result.push({
          rank: ranking.find((x) => x.username == element.username)?.rank,
          username: element.username,
          picture: element.picture,
          points: element.points,
          block: blocksUser.some((userElement) => {
            return (
              JSON.stringify({
                username: element.username,
                points: element.points,
                picture: element.picture,
              }) === JSON.stringify(userElement)
            );
          }),
          block_by: blocksByUser.some((userElement) => {
            return (
              JSON.stringify({
                username: element.username,
                points: element.points,
                picture: element.picture,
              }) === JSON.stringify(userElement)
            );
          }),
        });
      });
    }

    if (result.length == 0) {
      return {
        userList: [],
        myRank: myRank ? myRank.rank : 0,
      };
    }

    if (result[0].username == null) {
      return {
        userList: [],
        myRank: myRank ? myRank.rank : 0,
      };
    }

    return {
      userList: result,
      myRank: myRank ? myRank.rank : 0,
    };
  }

  private async findUserWithRelations(username: string): Promise<UserEntity> {
    return (
      await this.userRepository.find({
        relations: ['followers', 'following'],
        where: { username },
      })
    )[0];
  }

  findUserRelation(username: string, relation: string): Promise<UserEntity> {
    return this.userRepository.findOneOrFail({
      relations: [relation],
      where: { username },
    });
  }

  async followUser(currentUser: UserEntity, username: string): Promise<BaseResponseSchema> {
    //Get the follow details of the logged in user.
    const currentUserWithRelations = await this.findUserWithRelations(currentUser.username);

    // Get the details of the user to be followed.
    const followUser = await this.findUserByUsername(username);

    // If the user to be followed does not exist, throw a FlowException for not found.
    if (!followUser) {
      throw new FlowException([
        {
          message: 'Username does not exist!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }

    // Get the follow details of the user to be followed.
    const followUserWithRelations = await this.findUserWithRelations(username);
    const followUserNotification = await this.findUserRelation(username, 'notification');

    // To check if the logged in user already follows the given user.
    const check = currentUserWithRelations.following.find((user) => user.id === followUser.id);

    if (!check) {
      // Update the corresponding with new follower and following.
      currentUserWithRelations.following.push(followUser);
      followUserWithRelations.followers.push(currentUser);

      await this.userRepository.save(followUserWithRelations);
      await this.userRepository.save(currentUserWithRelations);

      await this.queueProducer.updatesQueue.add({
        user_id: followUser.id,
        num_of_follower: followUserWithRelations.followers.length,
        type: UpdateTypesEnum.FOLLOWERS,
      });

      if (followUserNotification.notification.followed_by_user && followUser.fcm_token) {
        await this.fcmNotificationService.pushNotification(
          followUser.username,
          'Hooray! You have a new followers!',
          `${currentUserWithRelations.username} just followed you.`,
          followUser.fcm_token,
          currentUserWithRelations.picture ? currentUserWithRelations.picture : '',
          NotificationType.NEW_FOLLOWER,
          undefined,
          currentUserWithRelations.username,
        );
      }

      return {
        message: 'Successful!',
      };
    }

    // If the logged in user already follows the give user, throw an error.
    else {
      throw new FlowException([
        {
          message: 'You are already following this user!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }
  }

  async unFollowUser(currentUser: UserEntity, username: string): Promise<BaseResponseSchema> {
    // Get the follow details of the logged in user.
    const currentUserWithRelations = await this.findUserWithRelations(currentUser.username);

    // Get the details of the user to be followed.
    const followUser = await this.findUserByUsername(username);

    // If the user to be followed does not exist, throw a FlowException for not found.
    if (!followUser) {
      throw new FlowException([
        {
          message: 'Username does not exist!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }

    // Get the follow details of the user to be followed.
    const followUserWithRelations = await this.findUserWithRelations(username);

    // To check if the logged in user does not follow the given user.
    const check = currentUserWithRelations.following.find((user) => user.id === followUser.id);

    if (check) {
      // Update the corresponding with new follower and following.
      currentUserWithRelations.following = currentUserWithRelations.following.filter(
        (user) => user.username !== username,
      );

      followUserWithRelations.followers = followUserWithRelations.followers.filter(
        (user) => user.username !== currentUser.username,
      );

      await this.userRepository.save(followUserWithRelations);
      await this.userRepository.save(currentUserWithRelations);

      await this.queueProducer.updatesQueue.add({
        user_id: followUser.id,
        num_of_follower: followUserWithRelations.followers.length,
        type: UpdateTypesEnum.FOLLOWERS,
      });

      return {
        message: 'Successful!',
      };
    }

    // If the logged in user does not follow the give user, throw an error.
    else {
      throw new FlowException([
        {
          message: 'You are not following this user!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }
  }

  async blockUser(currentUser: UserEntity, username: string): Promise<BaseResponseSchema> {
    //Get the block details of the logged in user.
    const currentUserWithRelations = await this.findUserRelation(currentUser.username, 'blocks');

    // Get the details of the user to be blocked.
    const blockUser = await this.findUserByUsername(username);

    // If the user to be blocked does not exist, throw a FlowException for not found.
    if (!blockUser) {
      throw new FlowException([
        {
          message: 'Username does not exist!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }

    // Get the block_by details of the user to be blocked.
    const blockUserWithRelations = await this.findUserRelation(username, 'blocks_by');

    // To check if the logged in user already blocked the given user.
    const check = currentUserWithRelations.blocks.find((user) => user.id === blockUser.id);

    if (!check) {
      // Update the corresponding with new blocks and blocks_by.
      currentUserWithRelations.blocks.push(blockUser);
      blockUserWithRelations.blocks_by.push(currentUser);

      await this.userRepository.save(blockUserWithRelations);
      await this.userRepository.save(currentUserWithRelations);

      const findFollowing = await this.followingList(currentUser, 1, 100, username);

      const findFollower = await this.followersList(currentUser, 1, 100, username);

      if (findFollowing.find((x) => x.username == username)) {
        await this.unFollowUser(currentUser, username);
      }

      if (findFollower.find((x) => x.username == blockUser.username)) {
        await this.unFollowUser(blockUser, currentUser.username);
      }

      return {
        message: 'Successful!',
      };
    }

    // If the logged in user already block the give user, throw an error.
    else {
      throw new FlowException([
        {
          message: 'You have already blocked this user!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }
  }

  async unblockUser(currentUser: UserEntity, username: string): Promise<BaseResponseSchema> {
    // Get the block details of the logged in user.
    const currentUserWithRelations = await this.findUserRelation(currentUser.username, 'blocks');

    // Get the details of the user to be blocked.
    const blockUser = await this.findUserByUsername(username);

    // If the user to be block does not exist, throw a FlowException for not found.
    if (!blockUser) {
      throw new FlowException([
        {
          message: 'Username does not exist!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }

    // Get the block details of the user to be blocked.
    const blockUserWithRelations = await this.findUserRelation(username, 'blocks_by');

    // To check if the logged in user does not block the given user.
    const check = currentUserWithRelations.blocks.find((user) => user.id === blockUser.id);

    if (check) {
      // Update the corresponding with new blocks and blocks_by.
      currentUserWithRelations.blocks = currentUserWithRelations.blocks.filter((user) => user.username !== username);

      blockUserWithRelations.blocks_by = blockUserWithRelations.blocks_by.filter(
        (user) => user.username !== currentUser.username,
      );

      await this.userRepository.save(blockUserWithRelations);
      await this.userRepository.save(currentUserWithRelations);

      return {
        message: 'Successful!',
      };
    }

    // If the logged in user does not block the give user, throw an error.
    else {
      throw new FlowException([
        {
          message: 'You have not blocked this user!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }
  }

  async unblockList(user: UserEntity, username_list: usernameDto[]): Promise<BaseResponseSchema> {
    await Promise.all(username_list.map((username) => this.unblockUser(user, username.username)));

    return {
      message: 'Successful!',
    };
  }

  async updatePlayingTime(user_id: number, time: number, startFlag: boolean): Promise<BaseResponseSchema> {
    let newTime;
    const result: BaseResponseSchema = new BaseResponseSchema();

    if (startFlag) {
      this.loginRepository.save({ user_id, start_time: new Date(time) });
      result.message = 'Update playing time successfully!';
    } else {
      const loginEntity = await this.loginRepository
        .createQueryBuilder('logins')
        .where(`user_id = '${user_id}' `)
        .orderBy('id', 'DESC')
        .getOne();

      if (!loginEntity) {
        throw new ConflictException([
          {
            message: 'start_time not set!',
            field: 'start',
            validation: 'conflict',
          },
        ]);
      }

      const start_time = loginEntity.start_time;
      if (!start_time) {
        throw new ConflictException([
          {
            message: 'start_time not set!',
            field: 'start',
            validation: 'conflict',
          },
        ]);
      }

      const duration = time - start_time.getTime();
      const user = await this.findOne({ id: user_id });
      if (!user) {
        throw new ConflictException([
          {
            message: 'This user not found!',
            field: 'user',
            validation: 'conflict',
          },
        ]);
      }

      newTime = duration + Number(user.playing_time);
      await this.updateUser({ id: user_id }, { playing_time: newTime });
      await this.loginRepository.update({ user_id, start_time: loginEntity.start_time }, { end_time: new Date(time) });
      result.message = 'Update playing time successfully!';
    }

    return result;
  }

  async getBlockUsers(user: UserEntity, page: number, limit: number, q?: string): Promise<UsersListSchema[]> {
    const result: UsersListSchema[] = [];
    let blocks: BlocksUserSchema[] = [];

    if (q) {
      blocks = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.blocks', 'blocks')
        .where('user.id = :id', { id: user.id })
        .select(['blocks'])
        .andWhere('blocks.username LIKE :q', { q: `%${q}%` })
        .limit(limit)
        .offset((page - 1) * limit)
        .execute();
    } else {
      blocks = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.blocks', 'blocks')
        .where('user.id = :id', { id: user.id })
        .select(['blocks'])
        .limit(limit)
        .offset((page - 1) * limit)
        .execute();
    }

    if (blocks.length == 0) {
      return [];
    }

    blocks.forEach((element) => {
      result.push({
        username: element.blocks_username,
        points: element.blocks_points,
        picture: element.blocks_picture,
      });
    });

    if (result.length == 0) {
      return [];
    }

    if (result[0].username == null) {
      return [];
    }

    return result;
  }

  async getBlockByUsers(user: UserEntity, page: number, limit: number): Promise<UsersListSchema[]> {
    const result: UsersListSchema[] = [];
    let blocks_by: BlocksByUserSchema[] = [];

    blocks_by = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.blocks_by', 'blocks_by')
      .where('user.id = :id', { id: user.id })
      .select(['blocks_by'])
      .limit(limit)
      .offset((page - 1) * limit)
      .execute();

    if (blocks_by.length == 0) {
      return [];
    }

    blocks_by.forEach((element) => {
      result.push({
        username: element.blocks_by_username,
        points: element.blocks_by_points,
        picture: element.blocks_by_picture,
      });
    });

    return result;
  }

  async assignUserLevel(username: string, levelId: number): Promise<BaseResponseSchema> {
    const user = await this.findUserByUsername(username);

    if (user) {
      await this.userRepository.update(
        { username: user.username },
        { user_level: await this.userLevelService.findWithId(levelId) },
      );

      return {
        message: 'Assign User Level successfully!',
      };
    }

    return {
      message: 'Assign User Level fail!',
    };
  }

  async assignUserPoint(username: string, point: number): Promise<BaseResponseSchema> {
    const user = await this.findUserByUsername(username);

    if (user) {
      await this.userRepository.update({ username: user.username }, { points: user.points + point });

      return {
        message: 'Successful!',
      };
    }

    return {
      message: 'Unsuccessful! Something went wrong.',
    };
  }

  async assignUserChips(username: string, silver_chips?: number, golden_chips?: number): Promise<BaseResponseSchema> {
    const user = await this.findUserByUsername(username);
    let new_silver = 0;
    let new_golden = 0;

    if (silver_chips) {
      new_silver = silver_chips;
    }

    if (golden_chips) {
      new_golden = golden_chips;
    }

    if (user) {
      await this.userRepository.update(
        { username: user.username },
        { silver_chips: user.silver_chips + new_silver, golden_chips: user.golden_chips + new_golden },
      );

      return {
        message: 'Successful!',
      };
    }

    return {
      message: 'Unsuccessful! Something went wrong.',
    };
  }

  saveAccess(input: Partial<UserEntity>): Promise<UserEntity> {
    return this.userRepository.save(input);
  }

  async hasAccess(from: UserEntity, to: UserEntity): Promise<boolean> {
    let result = false;
    const accesses = await this.findUserRelation(to.username, 'allowed');

    result = !!accesses.allowed.find((x) => x.id == from.id);
    return result;
  }

  async getAccessList(user: UserEntity, page: number, limit: number): Promise<UsersListSchema[]> {
    const result: UsersListSchema[] = [];

    const accesses: AllowedUserSchema[] = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.allowed', 'allowed')
      .where('user.id = :id', { id: user.id })
      .select(['allowed'])
      .limit(limit)
      .offset((page - 1) * limit)
      .execute();

    if (accesses.length == 0) {
      return [];
    }

    accesses.forEach((element) => {
      result.push({
        id: element.allowed_id,
        username: element.allowed_username,
        points: element.allowed_points,
        picture: element.allowed_picture,
        fcm_token: element.allowed_fcm_token,
      });
    });

    if (result.length == 0) {
      return [];
    }

    if (result[0].username == null) {
      return [];
    }

    return result;
  }

  async getAccessToList(user: UserEntity, page: number, limit: number): Promise<UsersListSchema[]> {
    const result: UsersListSchema[] = [];

    const accesses: AllowedByUserSchema[] = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.allowed_by', 'allowed_by')
      .where('user.id = :id', { id: user.id })
      .select(['allowed_by'])
      .limit(limit)
      .offset((page - 1) * limit)
      .execute();

    if (accesses.length == 0) {
      return [];
    }

    accesses.forEach((element) => {
      result.push({
        username: element.allowed_by_username,
        points: element.allowed_by_points,
        picture: element.allowed_by_picture,
      });
    });

    if (result.length == 0) {
      return [];
    }

    if (result[0].username == null) {
      return [];
    }

    return result;
  }

  async removeAccess(user: UserEntity, username: string): Promise<BaseResponseSchema> {
    const result: BaseResponseSchema = new BaseResponseSchema();
    result.message = 'Unsuccessful! Something went wrong.';

    const currentUserWithRelations = await this.findUserRelation(user.username, 'allowed');
    const allowedByUser = await this.findUserRelation(username, 'allowed_by');

    currentUserWithRelations.allowed = currentUserWithRelations.allowed.filter((user) => user.username !== username);
    allowedByUser.allowed_by = allowedByUser.allowed_by.filter((x) => x.username !== user.username);

    const updateResult = await this.userRepository.save(currentUserWithRelations);
    await this.userRepository.save(allowedByUser);

    if (updateResult) {
      result.message = 'Successful!';
    }

    return result;
  }

  async removeAccessList(user: UserEntity, username_list: usernameDto[]): Promise<BaseResponseSchema> {
    await Promise.all(username_list.map((username) => this.removeAccess(user, username.username)));

    return {
      message: 'Successful!',
    };
  }

  async removeAccessTo(user: UserEntity, username: string): Promise<BaseResponseSchema> {
    const result: BaseResponseSchema = new BaseResponseSchema();
    result.message = 'Unsuccessful! Something went wrong.';

    const currentUserWithRelations = await this.findUserRelation(user.username, 'allowed_by');
    const allowedByUser = await this.findUserRelation(username, 'allowed');

    currentUserWithRelations.allowed_by = currentUserWithRelations.allowed_by.filter(
      (user) => user.username !== username,
    );
    allowedByUser.allowed = allowedByUser.allowed.filter((x) => x.username !== user.username);

    const updateResult = await this.userRepository.save(currentUserWithRelations);
    await this.userRepository.save(allowedByUser);

    if (updateResult) {
      result.message = 'Successful!';
    }

    return result;
  }

  async removeAccessToList(user: UserEntity, username_list: usernameDto[]): Promise<BaseResponseSchema> {
    await Promise.all(username_list.map((username) => this.removeAccessTo(user, username.username)));

    return {
      message: 'Successful!',
    };
  }

  async getActiveUsersCount(): Promise<ActiveUsersCountSchema> {
    const result: ActiveUsersCountSchema = new ActiveUsersCountSchema();

    const daily = new Date().getTime() - 24 * 60 * 60 * 1000;
    const weekly = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
    const monthly = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;

    const dailyTime = 'start_time >= ' + "'" + new Date(daily).toISOString() + "'";
    const weeklyTime = 'start_time >= ' + "'" + new Date(weekly).toISOString() + "'";
    const monthlyTime = 'start_time >= ' + "'" + new Date(monthly).toISOString() + "'";

    result.daily = await this.loginRepository
      .createQueryBuilder('logins')
      .select('DISTINCT(logins.user_id)')
      .where(dailyTime)
      .getCount();

    result.weekly = await this.loginRepository
      .createQueryBuilder('logins')
      .select('DISTINCT(logins.user_id)')
      .where(weeklyTime)
      .getCount();

    result.monthly = await this.loginRepository
      .createQueryBuilder('logins')
      .select('DISTINCT(logins.user_id)')
      .where(monthlyTime)
      .getCount();

    return result;
  }

  async getReferredUsersCount(): Promise<CountSchema> {
    const result = await this.userRepository.createQueryBuilder('users').where('refer_by').getCount();

    return {
      count: result,
    };
  }

  async updateFCMToken(id: number, fcm_token: string): Promise<BaseResponseSchema> {
    const result: BaseResponseSchema = new BaseResponseSchema();

    const updateResult = await this.updateUser({ id }, { fcm_token });
    result.message = updateResult && updateResult ? 'Successful!' : 'Unsuccessful! Something went wrong.';

    return result;
  }

  async sendGoldChip(user: UserEntity, username: string): Promise<BaseResponseSchema> {
    if (!user.golden_chips) {
      throw new FlowException([
        {
          message: 'Do not have enough Golden Chips!',
          field: 'golden_chips',
          validation: 'not enough',
        },
      ]);
    }

    const receiverUser = await this.findUserByUsername(username);
    if (!receiverUser) {
      throw new FlowException([
        {
          message: 'Username does not exist!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }

    await this.updateUser({ id: user.id }, { golden_chips: user.golden_chips - 1 });
    await this.updateUser({ username }, { golden_chips: receiverUser.golden_chips + 1 });

    await this.queueProducer.updatesQueue.add({
      user_id: receiverUser.id,
      golden_chips: receiverUser.golden_chips + 1,
      type: UpdateTypesEnum.GOLDEN_CHIPS,
    });

    return {
      message: 'Successful!',
      golden_chips: user.golden_chips - 1,
    };
  }
}
