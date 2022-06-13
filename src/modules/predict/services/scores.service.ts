import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FlowException } from 'core/exceptions';
import { ChartTimeEnum } from 'modules/market-chart/enums/chart-time.enum';
import { UserEntity } from 'modules/users/entities/user.entity';
import { UsersService } from 'modules/users/services/users.services';
import { Repository } from 'typeorm';
import { ScoreEntity } from '../entities/scores.entity';
import { PredictStatusEnum } from '../enums/predict-status.enum';
import { RankChartSchema } from '../schemas/rank-chart.schema';

@Injectable()
export class ScoreService {
  constructor(
    @InjectRepository(ScoreEntity, 'mysql')
    private readonly scoreRepository: Repository<ScoreEntity>,

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  findAllByUser(user: UserEntity): Promise<ScoreEntity[]> {
    return this.scoreRepository.find({ user });
  }

  getScore(predict_point: number, sum_point: number, status: string): number {
    if (sum_point == 0) {
      sum_point = 100;
    }

    if (status === PredictStatusEnum.SUCCESS) {
      return 1 + predict_point / sum_point + (1 - 100 / predict_point);
    } else if (status === PredictStatusEnum.FAIL) {
      return -1 * (predict_point / sum_point);
    }

    return 0;
  }

  async updateRankFromScores(): Promise<void> {
    let rank = 1;
    const users = await this.usersService.findAllWithScoreOrder();

    users.forEach(async (user) => {
      await this.scoreRepository.save({ user, score: user.score, rank: rank++ });
    });
  }

  async getScoreChart(username: string, days: ChartTimeEnum): Promise<RankChartSchema> {
    const user = await this.usersService.findUserByUsername(username);

    if (!user) {
      throw new FlowException([
        {
          message: 'Username does not exist!',
          field: 'username',
          validation: 'not found',
        },
      ]);
    }

    const result: RankChartSchema = new RankChartSchema();
    result.chart_data = [];
    let scores: ScoreEntity[];

    let conditionalTime = 0;

    switch (days) {
      case ChartTimeEnum.MAX:
        conditionalTime = new Date().getTime() - 365 * 24 * 60 * 60 * 1000;
        break;

      case ChartTimeEnum.ONEDAY:
        conditionalTime = new Date().getTime() - 1 * 24 * 60 * 60 * 1000;
        break;

      case ChartTimeEnum.ONEWEEK:
        conditionalTime = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
        break;

      case ChartTimeEnum.ONEMONTH:
        conditionalTime = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;
        break;
      case ChartTimeEnum.THREEMONTH:
        conditionalTime = new Date().getTime() - 90 * 24 * 60 * 60 * 1000;
        break;
      case ChartTimeEnum.SIXMONTH:
        conditionalTime = new Date().getTime() - 180 * 24 * 60 * 60 * 1000;
        break;

      case ChartTimeEnum.ONEYEAR:
        conditionalTime = new Date().getTime() - 365 * 24 * 60 * 60 * 1000;
        break;
    }

    if (days === ChartTimeEnum.MAX) {
      scores = await this.scoreRepository
        .createQueryBuilder('scores')
        .where(`userId = '${user.id}' `)
        .orderBy('created_at', 'ASC')
        .getMany();
    } else {
      const created_at = 'created_at >= ' + "'" + new Date(conditionalTime).toISOString() + "'";

      scores = await this.scoreRepository
        .createQueryBuilder('scores')
        .where(`userId = '${user.id}' `)
        .andWhere(created_at)
        .orderBy('created_at', 'ASC')
        .getMany();
    }

    scores.forEach((score) => {
      result.chart_data.push({
        time: score.created_at.getTime(),
        value: score.rank,
      });
    });

    if (result.chart_data.length === 0) {
      result.chart_data.push({
        time: conditionalTime,
        value: Number(user.score),
      });
    }

    return result;
  }
}
