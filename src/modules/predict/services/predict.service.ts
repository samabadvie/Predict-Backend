import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseResponseSchema } from 'core/base-response.schema';
import { FlowException } from 'core/exceptions';
import { UserEntity } from 'modules/users/entities/user.entity';
import { UsersService } from 'modules/users/services/users.services';
import { Repository, UpdateResult } from 'typeorm';
import { PredictEntity } from '../entities/predict.entity';
import { PredictStatusEnum } from '../enums/predict-status.enum';
import { PredictTimeEnum } from '../enums/predict-time.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import WebSocket from 'ws';
import { PricesSchema } from '../schemas/prices.schema';
import { CoinSymbolEnum } from '../enums/coin-symbol.enum';
import { WaitingListSchema } from '../schemas/predict-waiting-list.schema';
import { PredictDoneListSchema } from '../schemas/predict-done-list.schema';
import { QueueProducer } from '../producers/queue.producer';
import { PredictCountSchema } from 'modules/users/schemas/predict-count.schema';
import { FCMNotificationService } from 'modules/notification/services/fcm-notification.service';
import { NotificationType } from 'modules/notification/enums/notification-type.enum';

@Injectable()
export class PredictService {
  constructor(
    @InjectRepository(PredictEntity, 'mysql')
    private readonly predictRepository: Repository<PredictEntity>,

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    private readonly queueProducer: QueueProducer,

    @Inject(forwardRef(() => FCMNotificationService))
    private readonly fcmNotificationService: FCMNotificationService,
  ) {}

  socket: WebSocket | undefined;

  data: Record<string, string> = {};

  // currentPrices: PricesSchema[] = [];

  pricesId = [
    { id: '362f0140-ecdd-4205-b8a0-36f0fd5d8167', symbol: CoinSymbolEnum.ADA, name: 'Cardano' },
    { id: '7dc551ba-cfed-4437-a027-386044415e3e', symbol: CoinSymbolEnum.BNB, name: 'Binance Coin' },
    { id: '1e31218a-e44e-4285-820c-8282ee222035', symbol: CoinSymbolEnum.BTC, name: 'Bitcoin' },
    { id: '7d793fa7-5fc6-432a-b26b-d1b10769d42e', symbol: CoinSymbolEnum.DOGE, name: 'Dogecoin' },
    { id: '21c795f5-1bfd-40c3-858e-e9d7e820c6d0', symbol: CoinSymbolEnum.ETH, name: 'Ethereum' },
    { id: 'c7c3697d-1b9c-42bf-9664-a366634ce2b3', symbol: CoinSymbolEnum.LTC, name: 'Litecoin' },
    { id: '86da9b7d-922b-4abb-8599-e75c6fa5a138', symbol: CoinSymbolEnum.LUNA, name: 'Terra' },
    { id: 'da6a0575-ec95-4c47-855d-5fc6a3e22ada', symbol: CoinSymbolEnum.DOT, name: 'Polkadot' },
    { id: 'b3d5d66c-26a2-404c-9325-91dc714a722b', symbol: CoinSymbolEnum.SOL, name: 'Solana' },
    { id: '97775be0-2608-4720-b7af-f85b24c7eb2d', symbol: CoinSymbolEnum.XRP, name: 'XRP' },
  ];

  private sumDate(start: Date, minute: number): Date {
    const end = start.getTime() + new Date(minute * 60 * 1000).getTime();
    return new Date(end);
  }

  private updatePrice(): Promise<PricesSchema[]> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(`wss://data.messari.io/api/v2/updates/assets/metrics/market-data?limit=1000`);
      this.socket.onmessage = (data): void => {
        let result: PricesSchema[] = [];

        data.data
          .toString()
          .split('\n')
          .map((dataLine) => {
            const [id, ...prices] = dataLine.split(',');
            this.data[id] = prices.join(',');
          });

        this.pricesId.forEach((element) => {
          result.push({
            id: element.id,
            symbol: element.symbol,
            value: this.data[element.id],
          });
        });

        if (result.find((x) => x.value == undefined)) {
          result = [];
        } else {
          this.socket?.close();
          resolve(result);
        }
      };

      this.socket.onerror = (error): void => reject(`websocket error symbol: ${error}`);
    });
  }

  update(input: Partial<PredictEntity>, update: Partial<PredictEntity>): Promise<UpdateResult> {
    return this.predictRepository.update(input, update);
  }

  async addPrediction(
    user: UserEntity,
    start_value: string,
    symbol: string,
    time: string,
    point: number,
    direction: string,
    start_time: Date,
  ): Promise<BaseResponseSchema> {
    let end_time;

    const accessUsers = await this.usersService.getAccessList(user, 1, 1000);

    if (user.available_points == 100) {
      const waitings = await this.getWaitingList(user, 1, 2000);

      if (waitings.count > 0) {
        throw new FlowException([
          {
            message: 'You have already submitted a prediction with 0 point!',
            field: 'point',
            validation: 'not enough',
          },
        ]);
      }
    }

    if (user.points <= 100) {
      point = 100;
    } else if (user.available_points < point) {
      throw new FlowException([
        {
          message: 'Do not have enough Points!',
          field: 'point',
          validation: 'not enough',
        },
      ]);
    }

    switch (time) {
      case PredictTimeEnum.OneMinute:
        end_time = this.sumDate(start_time, 1);
        break;

      case PredictTimeEnum.FifteenMinute:
        end_time = this.sumDate(start_time, 15);
        break;

      case PredictTimeEnum.ThirtyMinute:
        end_time = this.sumDate(start_time, 30);
        break;

      case PredictTimeEnum.FortyFiveMinute:
        end_time = this.sumDate(start_time, 45);
        break;

      case PredictTimeEnum.OneHour:
        end_time = this.sumDate(start_time, 60);
        break;

      case PredictTimeEnum.OneDay:
        end_time = this.sumDate(start_time, 24 * 60);
        break;
    }

    if (user.silver_chips > 0) {
      await this.predictRepository.save(
        new PredictEntity({
          user_id: user.id,
          symbol,
          time,
          point,
          direction,
          start_time,
          end_time,
          start_value,
          status: PredictStatusEnum.WAITING,
        }),
      );
      await this.usersService.updateUser(
        { id: user.id },
        {
          silver_chips: user.silver_chips - 1,
          available_points: user.points != 0 ? user.available_points - point : 100,
          total_predicts: user.total_predicts + 1,
        },
      );
    } else {
      throw new FlowException([
        {
          message: 'Do not have enough Silver Chips!',
          field: 'silver_chips',
          validation: 'not enough',
        },
      ]);
    }
    //todo : change name of app_push_notification to other user new prediction
    if (accessUsers) {
      accessUsers.forEach(async (element) => {
        const userNotification = await this.usersService.findUserRelation(element.username, 'notification');
        if (element.fcm_token && userNotification.notification.app_push_notification) {
          await this.fcmNotificationService.pushNotification(
            element.username ? element.username : '',
            `${user.username} made a new prediction!`,
            `See what ${user.username} guesses about the future!`,
            element.fcm_token,
            user.picture ? user.picture : '',
            NotificationType.OTHER_USER_NEW_PREDICTION,
            {
              screen: 'OthersProfile',
              passedData: user.username,
            },
            user.username,
          );
        }
      });
    }

    return {
      message: 'Prediction added successfully.',
      available_points: user.points != 0 ? user.available_points - point : 100,
      silver_chips: user.silver_chips - 1,
    };
  }

  private getWaitingPredict(id: number): Promise<PredictEntity | undefined> {
    return this.predictRepository.findOne({ id, status: PredictStatusEnum.WAITING });
  }

  private removePredictEntity(predict: PredictEntity): Promise<PredictEntity> {
    return this.predictRepository.remove(predict);
  }

  async removePrediction(user: UserEntity, id: number): Promise<BaseResponseSchema> {
    if (!user) {
      throw new FlowException([
        {
          message: 'Username does not exist!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }

    const userWithLevel = await this.usersService.findUserRelation(user.username, 'user_level');

    if (!userWithLevel.user_level.allow_cancel_predict) {
      throw new FlowException([
        {
          message: 'You can not cancel your prediction in this level!',
          field: '',
          validation: 'not allowed',
        },
      ]);
    }

    const waitingPredict = await this.getWaitingPredict(id);

    if (!waitingPredict) {
      throw new FlowException([
        {
          message: 'The prediction not found!',
          field: 'waitingPredict',
          validation: 'not found',
        },
      ]);
    }

    await this.removePredictEntity(waitingPredict);
    await this.usersService.updateUser(
      { id: user.id },
      { total_predicts: user.total_predicts - 1, available_points: user.available_points + waitingPredict.point },
    );

    return {
      message: 'Prediction canceled successfully.',
    };
  }

  async getWaitingList(user: UserEntity, page: number, limit: number): Promise<WaitingListSchema> {
    let negativeTime = false;
    let output: PredictEntity[] = [];
    const result: WaitingListSchema = new WaitingListSchema();
    result.predicts = [];

    result.count = await this.predictRepository
      .createQueryBuilder('predict')
      .where('predict.status = :status', { status: PredictStatusEnum.WAITING })
      .andWhere(`user_id = '${user.id}' `)
      .getCount();

    output = await this.predictRepository
      .createQueryBuilder('predict')
      .where('predict.status = :status', { status: PredictStatusEnum.WAITING })
      .andWhere(`user_id = '${user.id}' `)
      .orderBy('end_time', 'ASC')
      .take(limit)
      .skip((page - 1) * limit)
      .getMany();

    output.forEach((element) => {
      if (element.end_time) {
        const difTime = new Date(element.end_time.getTime() - new Date().getTime());

        if (element.end_time.getTime() < new Date().getTime()) {
          negativeTime = true;
        }

        const messariID = this.pricesId.find((x) => x.symbol == element.symbol)?.id;

        result.predicts.push({
          id: element.id,
          symbol: element.symbol,
          start_time: element.start_time,
          end_time: negativeTime
            ? '00:00:00'
            : difTime.getHours().toString() +
              ':' +
              difTime.getMinutes().toString() +
              ':' +
              difTime.getSeconds().toString(),
          price: element.start_value,
          direction: element.direction,
          point: element.point,
          messariID: messariID,
        });
      }
    });

    return result;
  }

  async getDoneList(
    user: UserEntity,
    page: number,
    limit: number,
    coin?: string,
    status?: string,
    time?: string,
  ): Promise<{ count: number; predicts: PredictDoneListSchema[] }> {
    let output: PredictEntity[] = [];
    const result: PredictDoneListSchema[] = [];

    const count = await this.predictRepository
      .createQueryBuilder('predict')
      .where('predict.status != :status', { status: PredictStatusEnum.WAITING })
      .andWhere(`user_id = '${user.id}' `)
      .getCount();

    if (coin && status && time) {
      const symbol = this.pricesId.find((x) => x.name == coin)?.symbol;

      output = await this.predictRepository
        .createQueryBuilder('predict')
        .where('predict.status != :status', { status: PredictStatusEnum.WAITING })
        .andWhere(`user_id = '${user.id}' `)
        .andWhere('symbol LIKE :symbol', { symbol: `%${symbol}%` })
        .andWhere('status LIKE :status', { status: `%${status}%` })
        .andWhere('time LIKE :time', { time: `%${time}%` })
        .orderBy('end_time', 'ASC')
        .take(limit)
        .skip((page - 1) * limit)
        .getMany();
    } else if (coin && status) {
      const symbol = this.pricesId.find((x) => x.name == coin)?.symbol;

      output = await this.predictRepository
        .createQueryBuilder('predict')
        .where('predict.status != :status', { status: PredictStatusEnum.WAITING })
        .andWhere(`user_id = '${user.id}' `)
        .andWhere('symbol LIKE :symbol', { symbol: `%${symbol}%` })
        .andWhere('status LIKE :status', { status: `%${status}%` })
        .orderBy('end_time', 'ASC')
        .take(limit)
        .skip((page - 1) * limit)
        .getMany();
    } else if (coin && time) {
      const symbol = this.pricesId.find((x) => x.name == coin)?.symbol;

      output = await this.predictRepository
        .createQueryBuilder('predict')
        .where('predict.status != :status', { status: PredictStatusEnum.WAITING })
        .andWhere(`user_id = '${user.id}' `)
        .andWhere('symbol LIKE :symbol', { symbol: `%${symbol}%` })
        .andWhere('time LIKE :time', { time: `%${time}%` })
        .orderBy('end_time', 'ASC')
        .take(limit)
        .skip((page - 1) * limit)
        .getMany();
    } else if (status && time) {
      output = await this.predictRepository
        .createQueryBuilder('predict')
        .where('predict.status != :status', { status: PredictStatusEnum.WAITING })
        .andWhere(`user_id = '${user.id}' `)
        .andWhere('status LIKE :status', { status: `%${status}%` })
        .andWhere('time LIKE :time', { time: `%${time}%` })
        .orderBy('end_time', 'ASC')
        .take(limit)
        .skip((page - 1) * limit)
        .getMany();
    } else if (coin) {
      const symbol = this.pricesId.find((x) => x.name == coin)?.symbol;

      output = await this.predictRepository
        .createQueryBuilder('predict')
        .where('predict.status != :status', { status: PredictStatusEnum.WAITING })
        .andWhere(`user_id = '${user.id}' `)
        .andWhere('symbol LIKE :symbol', { symbol: `%${symbol}%` })
        .orderBy('end_time', 'ASC')
        .take(limit)
        .skip((page - 1) * limit)
        .getMany();
    } else if (status) {
      output = await this.predictRepository
        .createQueryBuilder('predict')
        .where('predict.status != :status', { status: PredictStatusEnum.WAITING })
        .andWhere(`user_id = '${user.id}' `)
        .andWhere('status LIKE :status', { status: `%${status}%` })
        .orderBy('end_time', 'ASC')
        .take(limit)
        .skip((page - 1) * limit)
        .getMany();
    } else if (time) {
      output = await this.predictRepository
        .createQueryBuilder('predict')
        .where('predict.status != :status', { status: PredictStatusEnum.WAITING })
        .andWhere(`user_id = '${user.id}' `)
        .andWhere('time LIKE :time', { time: `%${time}%` })
        .orderBy('end_time', 'ASC')
        .take(limit)
        .skip((page - 1) * limit)
        .getMany();
    } else {
      output = await this.predictRepository
        .createQueryBuilder('predict')
        .where('predict.status != :status', { status: PredictStatusEnum.WAITING })
        .andWhere(`user_id = '${user.id}' `)
        .orderBy('end_time', 'DESC')
        .take(limit)
        .skip((page - 1) * limit)
        .getMany();
    }

    output.forEach((element) => {
      const formattedTime = element.end_time?.toString().split(' ');
      result.push({
        id: element.id,
        symbol: element.symbol,
        time: formattedTime
          ? formattedTime[0] + ', ' + formattedTime[2] + ' ' + formattedTime[1] + ' ' + formattedTime[3]
          : '',
        point: element.point,
        status: element.status == PredictStatusEnum.SUCCESS ? 'GET' : 'LOST',
        direction: element.direction,
        start_value: element.start_value,
        end_value: element.end_value,
        time_type: element.time,
      });
    });

    return { count, predicts: result };
  }

  async getPredictCount(symbol: CoinSymbolEnum): Promise<PredictCountSchema> {
    const result: PredictCountSchema = new PredictCountSchema();

    result.wins = await this.predictRepository
      .createQueryBuilder('predict')
      .where('predict.status = :status', { status: PredictStatusEnum.SUCCESS })
      .andWhere(`symbol = '${symbol}' `)
      .getCount();

    result.totals = await this.predictRepository
      .createQueryBuilder('predict')
      .where(`symbol = '${symbol}' `)
      .getCount();

    return result;
  }

  // async test(): Promise<BaseResponseSchema> {
  //   const result: BaseResponseSchema = new BaseResponseSchema();

  //   const predict = await this.predictRepository.find({ id: 1 });

  //   if (predict) {
  //     console.log('*********Added in test');

  //     await this.queueProducer.predictUpdatesQueue.add({
  //       user_id: '1',
  //       id: '1',
  //       status: 'Success',
  //       updatedPoint: 1200 ,
  //     });
  //   }

  //   return result;
  // }

  // @Interval(10000)
  @Cron(CronExpression.EVERY_10_SECONDS)
  async userPredictCheck(): Promise<void> {
    let currentPriceAllFloat,
      currentPrice = 0;
    // newPoint;
    const end_time = 'end_time <= ' + "'" + new Date().toISOString() + "'";
    const currentPrices = await this.updatePrice();
    // const currentTime = new Date();
    const predicts = await this.predictRepository
      .createQueryBuilder('predict')
      .where('predict.status = :status', { status: PredictStatusEnum.WAITING })
      .andWhere(end_time)
      .orderBy('end_time', 'ASC')
      .getMany();

    predicts.forEach(async (element) => {
      currentPriceAllFloat = currentPrices.find((x) => x.symbol == element.symbol)?.value.split(',')[0];

      if (currentPriceAllFloat) currentPrice = Number(Number.parseFloat(currentPriceAllFloat).toFixed(4));
      element.end_value = currentPrice.toString();

      const count = await this.queueProducer.waitingPredictionsQueue.count();

      console.log(end_time, ' - before add id:', element.id);
      console.log('Queue Count:', count);

      await this.queueProducer.waitingPredictionsQueue.add('predictJob', element);
      await this.predictRepository.update({ id: element.id }, { status: PredictStatusEnum.PROCESSING });
    });
  }
}
