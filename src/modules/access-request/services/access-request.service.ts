import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseResponseSchema } from 'core/base-response.schema';
import { FlowException } from 'core/exceptions';
import { NotificationType } from 'modules/notification/enums/notification-type.enum';
import { FCMNotificationService } from 'modules/notification/services/fcm-notification.service';
import { UserEntity } from 'modules/users/entities/user.entity';
import { UpdateTypesEnum } from 'modules/users/enums/update-types.enum';
import { QueueProducer } from 'modules/users/producers/queue.producer';
import { UsersService } from 'modules/users/services/users.services';
import { Repository } from 'typeorm';
import { AccessRequestEntity } from '../entities/access-request.entity';
import { AccessRequestListSchema } from '../schemas/access-request-list.schema';

@Injectable()
export class AccessRequestService {
  constructor(
    @InjectRepository(AccessRequestEntity, 'mysql')
    private readonly accessRequestRepository: Repository<AccessRequestEntity>,
    private readonly usersService: UsersService,

    @Inject(forwardRef(() => FCMNotificationService))
    private readonly fcmNotificationService: FCMNotificationService,

    public readonly queueProducer: QueueProducer,
  ) {}

  async findAll(user: UserEntity): Promise<AccessRequestListSchema[]> {
    const result: AccessRequestListSchema[] = [];
    const accessRequests = await this.accessRequestRepository.find({
      relations: ['from'],
      where: { to: user },
    });

    accessRequests.forEach((access) => {
      result.push({
        id: access.id,
        username: access.from.username,
        picture: access.from.picture,
        time: access.created_at,
      });
    });

    return result;
  }

  async createOne(from: UserEntity, username: string): Promise<AccessRequestEntity> {
    const toUser = await this.usersService.findUserRelation(username, 'notification');

    if (!toUser) {
      throw new FlowException([
        {
          message: 'Username does not exist!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }

    const request = await this.accessRequestRepository.findOne({ from, to: toUser });
    if (request) {
      throw new FlowException([
        {
          message: 'Request is already registered!',
          field: 'request',
          validation: 'request',
        },
      ]);
    }

    if (!from.golden_chips) {
      throw new FlowException([
        {
          message: 'Do not have enough Golden Chips!',
          field: 'golden_chips',
          validation: 'not enough',
        },
      ]);
    }

    await this.usersService.updateUser({ id: from.id }, { golden_chips: from.golden_chips - 1 });
    const access = await this.accessRequestRepository.save(
      new AccessRequestEntity({
        from,
        to: toUser,
      }),
    );
    access.from.golden_chips -= 1;

    await this.usersService.queueProducer.updatesQueue.add({
      user_id: toUser.id,
      num_of_access_request: (await this.findAll(toUser)).length,
      type: UpdateTypesEnum.ACCESS_REQUEST,
    });

    if (toUser.notification.access_request && toUser.fcm_token.length >= 10)
      await this.fcmNotificationService.pushNotification(
        toUser.username,
        'NEW access request!',
        `${from.username} wants to see you waiting predictions`,
        toUser.fcm_token,
        from.picture ? from.picture : '',
        NotificationType.ACCESS_REQUEST,
        undefined,
        from.username,
      );

    return access;
  }

  async allowAccess(user: UserEntity, id: number): Promise<BaseResponseSchema> {
    let removeResult = null;
    let updateUser = null;
    const result: BaseResponseSchema = new BaseResponseSchema();
    const currentUser = await this.usersService.findUserRelation(user.username, 'allowed');

    const access = await this.accessRequestRepository.findOne({
      relations: ['from'],
      where: { to: user, id },
    });

    if (access) {
      const allowedByUser = await this.usersService.findUserRelation(access.from.username, 'allowed_by');
      removeResult = await this.accessRequestRepository.remove(access);
      currentUser.allowed.push(access.from);
      //Added golden chips to current user
      currentUser.golden_chips += 1;

      allowedByUser.allowed_by.push(currentUser);

      updateUser = await this.usersService.saveAccess(currentUser);
      updateUser = await this.usersService.saveAccess(allowedByUser);

      result.message = removeResult && updateUser ? 'Successful!' : 'Unsuccessful! Something went wrong.';

      await this.queueProducer.updatesQueue.add({
        user_id: currentUser.id,
        golden_chips: currentUser.golden_chips + 1,
        type: UpdateTypesEnum.GOLDEN_CHIPS,
      });
    }
    return result;
  }

  async denyAccess(user: UserEntity, id: number): Promise<BaseResponseSchema> {
    let removeResult = null;
    const result: BaseResponseSchema = new BaseResponseSchema();

    const access = await this.accessRequestRepository.findOne({ id, to: user });

    if (access) {
      // return golden chips to deny user
      const accessFrom = await this.accessRequestRepository.findOne({
        relations: ['from'],
        where: { id, to: user },
      });

      if (accessFrom) {
        await this.usersService.updateUser(
          { id: accessFrom.from.id },
          { golden_chips: accessFrom.from.golden_chips + 1 },
        );
      }

      removeResult = await this.accessRequestRepository.remove(access);
      result.message = removeResult ? 'Successful!' : 'Unsuccessful! Something went wrong.';
    }
    return result;
  }

  async getLastAccessRequestTime(user: UserEntity): Promise<number> {
    const access = await this.accessRequestRepository.findOne({
      where: { to: user },
      order: { created_at: 'DESC' },
    });

    return access ? access.created_at.getTime() : 0;
  }
}
