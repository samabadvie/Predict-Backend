import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TopTwentyUsersSchema } from 'modules/users/schemas/top-twenty.users.schema';
import { UsersListSchema } from 'modules/users/schemas/users-list.schema';
import { Repository } from 'typeorm';
import { PointEntity } from '../entities/points.entity';

@Injectable()
export class PointService {
  constructor(
    @InjectRepository(PointEntity, 'mysql')
    private readonly pointRepository: Repository<PointEntity>,
  ) {}

  create(input: Partial<PointEntity>): Promise<PointEntity> {
    return this.pointRepository.save(input);
  }

  async getTopTwenty(
    days: number,
    page: number,
    limit: number,
    username: string,
    q?: string,
  ): Promise<{ userList: UsersListSchema[]; myRank: number }> {
    let rank = 1,
      myRank = 0;
    const result: UsersListSchema[] = [];
    const conditionalTime = new Date().getTime() - days * 24 * 60 * 60 * 1000;
    const end_time = 'time >= ' + "'" + new Date(conditionalTime).toISOString() + "'";

    let tops: TopTwentyUsersSchema[] = [];

    if (q) {
      tops = await this.pointRepository
        .createQueryBuilder('points')
        .where(end_time)
        .leftJoinAndSelect('points.user', 'user')
        .select('user.username')
        .addSelect('SUM(point)')
        .addSelect('user.picture')
        .andWhere('user.username LIKE :q', { q: `%${q}%` })
        .groupBy('userId')
        .orderBy('SUM(point)', 'DESC')
        .limit(limit)
        .offset((page - 1) * limit)
        .getRawMany();
    } else {
      tops = await this.pointRepository
        .createQueryBuilder('points')
        .where(end_time)
        .leftJoinAndSelect('points.user', 'user')
        .select('user.username')
        .addSelect('SUM(point)')
        .addSelect('user.picture')
        .groupBy('userId')
        .orderBy('SUM(point)', 'DESC')
        .limit(limit)
        .offset((page - 1) * limit)
        .getRawMany();
    }

    tops.forEach((top) => {
      if (Number(top['SUM(point)']) > 0) {
        if (top.user_username == username) {
          myRank = rank;
        }
        result.push({
          username: top.user_username,
          picture: top.user_picture,
          points: Number(top['SUM(point)']),
          rank: rank++,
        });
      }
    });

    return {
      userList: result,
      myRank,
    };
  }
}
